import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  generateTextMock,
  resolveLanguageModelMock,
  deepLTranslateTextMock,
  deepLConstructorSpy,
  googleTranslateMock,
} = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  resolveLanguageModelMock: vi.fn(),
  deepLTranslateTextMock: vi.fn(),
  deepLConstructorSpy: vi.fn(),
  googleTranslateMock: vi.fn(),
}))

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    generateText: generateTextMock,
  }
})

vi.mock('../../src/core/translate/ai/provider-loader', () => ({
  resolveLanguageModel: resolveLanguageModelMock,
  GATEWAY_PROVIDER_ID: 'gateway',
  listKnownProviderIds: () => ['gateway', 'openai'],
}))

vi.mock('deepl-node', () => ({
  DeepLClient: class {
    constructor(apiKey: string, options?: unknown) {
      deepLConstructorSpy(apiKey, options)
    }

    translateText = deepLTranslateTextMock
  },
}))

vi.mock('@vitalets/google-translate-api', () => ({
  translate: googleTranslateMock,
}))

describe('translator drivers sdk integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveLanguageModelMock.mockResolvedValue({ modelId: 'test-model' })
    generateTextMock.mockResolvedValue({
      output: { translation: ' translated text ' },
      text: ' translated text ',
    })
  })

  it('AiTranslator uses structured output and translation context', async () => {
    const { AiTranslator } = await import('../../src/core/translate/ai/translator')
    const translator = new AiTranslator('ai-key')

    const translated = await translator.translate('Hello', 'en', 'ru', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      translationContext: 'scope=global; keys=home.title',
    })

    expect(translated).toBe('translated text')
    expect(resolveLanguageModelMock).toHaveBeenCalledWith(
      'openai',
      'gpt-4o-mini',
      'ai-key',
      expect.objectContaining({
        translationContext: 'scope=global; keys=home.title',
      }),
    )
    expect(generateTextMock).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining('CONTEXT: scope=global; keys=home.title'),
      prompt: 'Hello',
      maxOutputTokens: 1024,
    }))
  })

  it('AiTranslator wraps SDK errors in unified format', async () => {
    const { AiTranslator } = await import('../../src/core/translate/ai/translator')
    generateTextMock.mockRejectedValue(new Error('rate limit'))
    const translator = new AiTranslator('ai-key')

    await expect(translator.translate('Hello', 'en', 'ru', {
      provider: 'openai',
      model: 'gpt-4o-mini',
    })).rejects.toThrow('AI API error: rate limit')
  })

  it('DeepLTranslator uses SDK and maps batch options', async () => {
    const { DeepLTranslator } = await import('../../src/core/translate/drivers/DeepLTranslator')
    deepLTranslateTextMock.mockResolvedValue([{ text: 'Привет' }])
    const translator = new DeepLTranslator('deepl-key', {
      maxRetries: '2',
      timeoutMs: '3000',
    })

    const translated = await translator.translateBatch(['Hello'], 'en', 'ru', {
      formality: 'more',
      glossary_id: 'glossary-1',
    })

    expect(translated).toEqual(['Привет'])
    expect(deepLConstructorSpy).toHaveBeenCalledWith(
      'deepl-key',
      expect.objectContaining({
        maxRetries: 2,
        minTimeout: 3000,
      }),
    )
    expect(deepLTranslateTextMock).toHaveBeenCalledWith(
      ['Hello'],
      'en',
      'ru',
      expect.objectContaining({
        formality: 'more',
        glossary: 'glossary-1',
      }),
    )
  })

  it('GoogleFreeTranslator uses library and wraps errors', async () => {
    const { GoogleFreeTranslator } = await import('../../src/core/translate/drivers/GoogleFreeTranslator')
    googleTranslateMock.mockResolvedValue({ text: 'Hola' })
    const translator = new GoogleFreeTranslator('')
    const translated = await translator.translate('Hello', 'en', 'es', { timeoutMs: '1500' })

    expect(translated).toBe('Hola')
    expect(googleTranslateMock).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({
        from: 'en',
        to: 'es',
      }),
    )

    googleTranslateMock.mockRejectedValue(new Error('429'))
    await expect(translator.translate('Hello', 'en', 'es')).rejects.toThrow(
      'Google Free Translate API error: 429',
    )
  })
})
