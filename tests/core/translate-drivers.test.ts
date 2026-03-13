import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  openAIChatCreateMock,
  openAIConstructorSpy,
  deepLTranslateTextMock,
  deepLConstructorSpy,
  googleTranslateMock,
} = vi.hoisted(() => ({
  openAIChatCreateMock: vi.fn(),
  openAIConstructorSpy: vi.fn(),
  deepLTranslateTextMock: vi.fn(),
  deepLConstructorSpy: vi.fn(),
  googleTranslateMock: vi.fn(),
}))

vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: openAIChatCreateMock,
      },
    }

    constructor(config: unknown) {
      openAIConstructorSpy(config)
    }
  },
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
  })

  it('OpenAITranslator uses unified retry and timeout options', async () => {
    const { OpenAITranslator } = await import('../../src/core/translate/drivers/OpenAITranslator')
    openAIChatCreateMock.mockResolvedValue({
      choices: [{ message: { content: ' translated text ' } }],
    })

    const translator = new OpenAITranslator('openai-key', {
      maxRetries: '4',
      timeoutMs: '1200',
    })
    const translated = await translator.translate('Hello', 'en', 'ru', {
      translationContext: 'scope=global; keys=home.title',
    })

    expect(translated).toBe('translated text')
    expect(openAIConstructorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'openai-key',
        maxRetries: 4,
        timeout: 1200,
      }),
    )
    expect(openAIChatCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('CONTEXT: scope=global; keys=home.title'),
        }),
      ]),
    }))
  })

  it('OpenAITranslator wraps SDK errors in unified format', async () => {
    const { OpenAITranslator } = await import('../../src/core/translate/drivers/OpenAITranslator')
    openAIChatCreateMock.mockRejectedValue(new Error('rate limit'))
    const translator = new OpenAITranslator('openai-key')

    await expect(translator.translate('Hello', 'en', 'ru')).rejects.toThrow('OpenAI API error: rate limit')
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
