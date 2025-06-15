import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import syncCommand from '../../src/commands/sync'
import { loadJsonFile, writeJsonFile } from '../../src/utils/json'
import { getI18nConfig } from '../../src/utils/kit'

vi.mock('../../src/utils/json')
vi.mock('../../src/utils/kit')
vi.mock('fs')
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
    log: vi.fn(),
  },
}))

describe('sync command', () => {
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
      ...args,
    },
    rawArgs: [],
    cmd: syncCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === mockTranslationDir) return true
        if (path.endsWith('.json')) return true
      }
      return false
    })
    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: mockLocales,
      translationDir: mockTranslationDir,
      defaultLocale: 'en',
    })
    vi.mocked(loadJsonFile).mockReturnValue({})
  })

  it('should synchronize translations from reference locale to other locales', async () => {
    const command = syncCommand
    if (!command) throw new Error('Command not found')

    const referenceTranslations = {
      key1: 'value1',
      key2: 'value2',
      pages: {
        about: {
          title: 'About',
          description: 'About page',
        },
      },
    }

    const targetTranslations = {
      key1: 'value1_ru',
      key3: 'value3',
      pages: {
        about: {
          title: 'О нас',
          extra: 'Extra',
        },
      },
    }

    vi.mocked(loadJsonFile)
      .mockImplementation((path: string) => {
        if (path.endsWith('en.json')) return referenceTranslations
        if (path.endsWith('ru.json')) return targetTranslations
        if (path.endsWith('de.json')) return {}
        return {}
      })

    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что ru.json был обновлен
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockTranslationDir}/ru.json`,
      {
        key1: 'value1_ru', // Сохраняем существующий перевод
        key2: '', // Добавляем отсутствующий ключ с пустым значением
        pages: {
          about: {
            title: 'О нас', // Сохраняем существующий перевод
            description: '', // Добавляем отсутствующий ключ с пустым значением
          },
        },
      },
    )

    // Проверяем, что de.json был обновлен
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockTranslationDir}/de.json`,
      {
        key1: '',
        key2: '',
        pages: {
          about: {
            title: '',
            description: '',
          },
        },
      },
    )
  })

  it('should handle missing translation files', async () => {
    const command = syncCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === mockTranslationDir) return true
        if (path.endsWith('en.json')) return true
        if (path.endsWith('ru.json')) return false
        if (path.endsWith('de.json')) return true
      }
      return false
    })

    const referenceTranslations = {
      key1: 'value1',
      key2: 'value2',
    }

    vi.mocked(loadJsonFile)
      .mockImplementation((path: string) => {
        if (path.endsWith('en.json')) return referenceTranslations
        if (path.endsWith('de.json')) return {}
        return {}
      })

    if (command.run) await command.run(createCommandContext({}))

    expect(consola.warn).toHaveBeenCalledWith(
      'Translation file for locale ru does not exist.',
    )

    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockTranslationDir}/de.json`,
      {
        key1: '',
        key2: '',
      },
    )

    expect(writeJsonFile).toHaveBeenCalledTimes(1)
  })

  it('should handle invalid JSON files', async () => {
    const command = syncCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(loadJsonFile)
      .mockReturnValueOnce({}) // Для en.json
      .mockImplementationOnce(() => {
        throw new Error('Invalid JSON')
      }) // Для ru.json

    if (command.run) {
      await expect(command.run(createCommandContext({}))).rejects.toThrow('Invalid JSON')
    }
  })
})
