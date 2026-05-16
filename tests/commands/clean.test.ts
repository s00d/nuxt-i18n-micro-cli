import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consola } from 'consola'
import cleanCommand from '../../src/commands/clean'
import { loadJsonFile, writeJsonFile } from '../../src/core/utils/json'
import { extractTranslations } from '../../src/core/utils/components'
import { getI18nConfig } from '../../src/core/utils/kit'

vi.mock('../../src/core/utils/json', () => ({
  loadJsonFile: vi.fn(),
  writeJsonFile: vi.fn(),
}))
vi.mock('../../src/core/utils/components')
vi.mock('../../src/core/utils/kit', () => ({
  getI18nConfig: vi.fn(),
}))
vi.mock('node:fs')
vi.mock('path', () => {
  const actual = vi.importActual('path')
  return {
    default: {
      join: (...args: string[]) => args.join('/'),
      basename: (path: string) => path.split('/').pop() || '',
      dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
    },
    ...actual,
  }
})
vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('clean command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir = '/test/project/locales'
  const mockLocales = [
    { code: 'en' },
    { code: 'ru' },
    { code: 'de' },
  ]

  const createCommandContext = (args: { cwd?: string, translationDir?: string, logLevel?: string }) => ({
    args: {
      _: [],
      cwd: mockCwd,
      translationDir: mockTranslationDir,
      logLevel: 'info',
      include: '',
      exclude: '',
      ...args,
    },
    rawArgs: [],
    cmd: cleanCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === mockTranslationDir) return true
        if (path.endsWith('.json')) return true
        if (path.includes('/pages')) return true
      }
      return false
    })
    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: mockLocales,
      translationDir: mockTranslationDir,
      translationDirs: [mockTranslationDir],
      defaultLocale: 'en',
      nuxtRoot: '/test/project',
    })
    vi.mocked(loadJsonFile).mockReturnValue({})
    vi.mocked(fs.readdirSync).mockImplementation((dir: fs.PathLike, options?: { withFileTypes?: boolean }) => {
      if (options?.withFileTypes) {
        return []
      }
      return []
    })
    vi.mocked(extractTranslations).mockReturnValue({
      global: new Set<string>(),
      pageSpecific: {},
      components: {},
    })
  })

  it('should clean unused and empty translation keys from global translations', async () => {
    const command = cleanCommand
    if (!command) throw new Error('Command not found')

    const usedKeys = new Set(['key1', 'key2'])
    vi.mocked(extractTranslations).mockReturnValue({
      global: usedKeys,
      pageSpecific: {},
      components: {},
    })

    const translations = {
      key1: 'value1',
      key2: '',
      key3: 'value3',
      key4: null,
      nested: {
        key5: 'value5',
        key6: '',
      },
    }
    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({}))

    mockLocales.forEach((locale) => {
      expect(writeJsonFile).toHaveBeenCalledWith(
        `${mockTranslationDir}/${locale.code}.json`,
        {
          key1: 'value1',
          key2: '',
        },
      )
    })
  })

  it('should clean unused and empty translation keys from page-specific translations', async () => {
    const command = cleanCommand
    if (!command) throw new Error('Command not found')

    const usedPageKeys = new Set(['title', 'description'])
    vi.mocked(extractTranslations).mockReturnValue({
      global: new Set<string>(),
      pageSpecific: {
        about: usedPageKeys,
      },
      components: {},
    })

    const translations = {
      pages: {
        about: {
          title: 'About',
          description: '',
          extra: 'Extra',
          nested: {
            key1: 'value1',
            key2: '',
          },
        },
      },
    }
    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({}))

    mockLocales.forEach((locale) => {
      expect(writeJsonFile).toHaveBeenCalledWith(
        `${mockTranslationDir}/${locale.code}.json`,
        {},
      )
    })
  })

  it('should handle missing translation directory', async () => {
    const command = cleanCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(fs.existsSync).mockReturnValueOnce(false)

    if (command.run) await expect(command.run(createCommandContext({
      translationDir: '/non-existent',
    }))).resolves.toBeUndefined()
  })

  it('should handle empty translation files', async () => {
    const command = cleanCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(loadJsonFile).mockReturnValue({})

    if (command.run) await command.run(createCommandContext({}))

    mockLocales.forEach((locale) => {
      expect(writeJsonFile).toHaveBeenCalledWith(
        `${mockTranslationDir}/${locale.code}.json`,
        {},
      )
    })
  })

  it('should handle invalid JSON files', async () => {
    const command = cleanCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(loadJsonFile).mockImplementationOnce(() => {
      throw new Error('Invalid JSON')
    })

    if (command.run) {
      await expect(command.run(createCommandContext({}))).rejects.toThrow('Invalid JSON')
    }
  })

  it('should clean nested translations correctly', async () => {
    const command = cleanCommand
    if (!command) throw new Error('Command not found')

    const usedKeys = new Set(['nested.key1', 'nested.key2'])
    vi.mocked(extractTranslations).mockReturnValue({
      global: usedKeys,
      pageSpecific: {},
      components: {},
    })

    const translations = {
      nested: {
        key1: 'value1',
        key2: '',
        key3: 'value3',
        subnested: {
          key4: 'value4',
          key5: '',
        },
      },
    }
    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({}))

    mockLocales.forEach((locale) => {
      expect(writeJsonFile).toHaveBeenCalledWith(
        `${mockTranslationDir}/${locale.code}.json`,
        {
          nested: {
            key1: 'value1',
            key2: '',
          },
        },
      )
    })
  })

  it('should report success after cleaning', async () => {
    const command = cleanCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({}))

    expect(vi.mocked(consola.success)).toHaveBeenCalledWith('Cleaned unused translations')
  })
})
