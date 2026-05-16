import { beforeEach, describe, expect, it, vi } from 'vitest'
import { translateMissing } from '../../src/core/services/TranslationService'
import { translateBatchTexts } from '../../src/core/translate'

vi.mock('../../src/core/translate', () => ({
  translateBatchTexts: vi.fn(),
}))

interface LocaleSetMock {
  getFlatGlobalKeys: () => Record<string, string>
  getFlatPageKeys: (scope: string) => Record<string, string>
  setValue: (key: string, value: string, scope: string) => void
}

function createLocaleSet(initialGlobal: Record<string, string>, initialPages: Record<string, Record<string, string>>): LocaleSetMock {
  const global = { ...initialGlobal }
  const pages = Object.fromEntries(
    Object.entries(initialPages).map(([scope, values]) => [scope, { ...values }]),
  )
  return {
    getFlatGlobalKeys: () => global,
    getFlatPageKeys: (scope: string) => pages[scope] ?? {},
    setValue: (key: string, value: string, scope: string) => {
      if (scope === 'global') {
        global[key] = value
        return
      }
      pages[scope] ||= {}
      pages[scope][key] = value
    },
  }
}

function createProjectMock(params: {
  defaultLocale?: string
  locales: string[]
  defaultGlobal: Record<string, string>
  defaultPages?: Record<string, Record<string, string>>
}) {
  const defaultPages = params.defaultPages ?? {}
  const defaultSet = {
    getFlatGlobalKeys: () => params.defaultGlobal,
    getPageScopes: () => Object.keys(defaultPages),
    getFlatPageKeys: (scope: string) => defaultPages[scope] ?? {},
  }

  const localeSets = new Map<string, LocaleSetMock>()
  for (const locale of params.locales) {
    if (locale !== (params.defaultLocale ?? 'en')) {
      localeSets.set(locale, createLocaleSet({}, {}))
    }
  }

  return {
    config: {
      defaultLocale: params.defaultLocale ?? 'en',
      locales: params.locales.map(code => ({ code })),
    },
    getDefaultLocaleSet: () => defaultSet,
    getLocale: (locale: string) => {
      const set = localeSets.get(locale)
      if (!set) {
        throw new Error(`Missing locale set for ${locale}`)
      }
      return set
    },
  }
}

describe('TranslationService batching and llm context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(translateBatchTexts).mockImplementation(async (texts: string[]) => texts.map(text => `tr:${text}`))
  })

  it('passes contextual metadata for LLM batch requests', async () => {
    const project = createProjectMock({
      locales: ['en', 'ru'],
      defaultGlobal: {
        'home.title': 'Welcome',
        'home.subtitle': 'Fast translations',
      },
    })

    await translateMissing(project as never, {
      service: 'ai',
      token: 'token',
      options: { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.1 },
      replace: false,
    })

    expect(translateBatchTexts).toHaveBeenCalledTimes(1)
    expect(translateBatchTexts).toHaveBeenCalledWith(
      ['Welcome', 'Fast translations'],
      'en',
      'ru',
      'ai',
      'token',
      expect.objectContaining({
        temperature: 0.1,
        translationContext: expect.stringContaining('scope=global'),
      }),
    )
  })

  it('passes glossary context for matching locale pair', async () => {
    const project = createProjectMock({
      locales: ['en', 'ru'],
      defaultGlobal: {
        homeTitle: 'Save',
      },
    })

    await translateMissing(project as never, {
      service: 'ai',
      token: 'token',
      options: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        glossaryCatalog: {
          entries: [
            { source: 'Save', target: 'Сохранить', from: 'en', to: 'ru' },
            { source: 'Dashboard', target: 'Панель', from: 'en', to: 'ru' },
          ],
        },
      },
      replace: false,
    })

    expect(translateBatchTexts).toHaveBeenCalledWith(
      ['Save'],
      'en',
      'ru',
      'ai',
      'token',
      expect.objectContaining({
        glossaryContext: expect.stringContaining('Save => Сохранить'),
      }),
    )
  })

  it('uses smaller default batch size for LLM services', async () => {
    const defaultGlobal = Object.fromEntries(
      Array.from({ length: 45 }, (_, index) => [`k${index + 1}`, `Text ${index + 1}`]),
    )
    const project = createProjectMock({
      locales: ['en', 'ru'],
      defaultGlobal,
    })

    await translateMissing(project as never, {
      service: 'ai',
      token: 'token',
      options: { provider: 'mistral', model: 'mistral-small-latest' },
      replace: false,
    })

    const calls = vi.mocked(translateBatchTexts).mock.calls
    expect(calls).toHaveLength(3)
    expect(calls[0]?.[0]).toHaveLength(20)
    expect(calls[1]?.[0]).toHaveLength(20)
    expect(calls[2]?.[0]).toHaveLength(5)
  })

  it('splits batches by character budget when configured', async () => {
    const project = createProjectMock({
      locales: ['en', 'ru'],
      defaultGlobal: {
        a: '1234567890',
        b: 'abcdefghij',
        c: 'klmnopqrst',
      },
    })

    await translateMissing(project as never, {
      service: 'ai',
      token: 'token',
      replace: false,
      chunkSize: 10,
      options: { provider: 'openai', model: 'gpt-4o-mini', batchMaxChars: 15 },
    })

    const calls = vi.mocked(translateBatchTexts).mock.calls
    expect(calls).toHaveLength(3)
    expect(calls[0]?.[0]).toEqual(['1234567890'])
    expect(calls[1]?.[0]).toEqual(['abcdefghij'])
    expect(calls[2]?.[0]).toEqual(['klmnopqrst'])
  })
})
