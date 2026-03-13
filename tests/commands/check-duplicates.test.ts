import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consola } from 'consola'
import checkDuplicatesCommand from '../../src/commands/check-duplicates'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

// Мокаем consola
vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('check-duplicates command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const localeData: Record<string, { global: Record<string, string>, pages: Record<string, Record<string, string>> }> = {
      en: {
        global: { 'greeting': 'Hello', 'welcome': 'Hello', 'nested.message': 'Hello' },
        pages: {
          page1: { 'title': 'Hello', 'greeting': 'Hello', 'welcome': 'Hello', 'nested.message': 'Hello' },
          page2: { 'greeting': 'Hello', 'welcome': 'Hello', 'nested.message': 'Hello' },
        },
      },
      ru: {
        global: { greeting: 'Привет', welcome: 'Привет' },
        pages: {},
      },
    }
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test',
      translationDir: '/path/to/translations',
      config: { locales: [{ code: 'en' }, { code: 'ru' }] },
      project: {
        getLocaleCodes: () => ['en', 'ru'],
        getLocale: (code: string) => ({
          getFlatGlobalKeys: () => localeData[code].global,
          getPageScopes: () => Object.keys(localeData[code].pages),
          getFlatPageKeys: (scope: string) => localeData[code].pages[scope] ?? {},
        }),
      },
    } as never)
  })

  it('should check for duplicates in global translations', async () => {
    if (checkDuplicatesCommand.run) await checkDuplicatesCommand.run({ args: { cwd: '/test', translationDir: '/path/to/translations', logLevel: 'info' } } as never)

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Hello" found in locale en:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - greeting')
    expect(infoCalls).toContain(' - global - welcome')
    expect(infoCalls).toContain(' - global - nested.message')
  })

  it('should check for duplicates in nested translations', async () => {
    if (checkDuplicatesCommand.run) await checkDuplicatesCommand.run({ args: { cwd: '/test', translationDir: '/path/to/translations', logLevel: 'info' } } as never)

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Hello" found in locale en:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - nested.message')
  })

  it('should check for duplicates across global and page translations', async () => {
    if (checkDuplicatesCommand.run) await checkDuplicatesCommand.run({ args: { cwd: '/test', translationDir: '/path/to/translations', logLevel: 'info' } } as never)

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Hello" found in locale en:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - greeting')
    expect(infoCalls).toContain(' - global - welcome')
    expect(infoCalls).toContain(' - global - nested.message')
    expect(infoCalls).toContain(' - pages/page1 - title')
    expect(infoCalls).toContain(' - pages/page1 - greeting')
    expect(infoCalls).toContain(' - pages/page1 - welcome')
    expect(infoCalls).toContain(' - pages/page1 - nested.message')
    expect(infoCalls).toContain(' - pages/page2 - greeting')
    expect(infoCalls).toContain(' - pages/page2 - welcome')
    expect(infoCalls).toContain(' - pages/page2 - nested.message')
  })

  it('should check all locales for duplicates', async () => {
    if (checkDuplicatesCommand.run) await checkDuplicatesCommand.run({ args: { cwd: '/test', translationDir: '/path/to/translations', logLevel: 'info' } } as never)

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Привет" found in locale ru:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - greeting')
    expect(infoCalls).toContain(' - global - welcome')
  })
})
