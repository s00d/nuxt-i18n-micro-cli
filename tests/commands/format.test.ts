import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import formatCommand from '../../src/commands/format'
import { loadJsonFile, writeJsonFile } from '../../src/utils/json'
import { getI18nConfig } from '../../src/utils/kit'

vi.mock('../../src/utils/json')
vi.mock('../../src/utils/kit')
vi.mock('fs', () => {
  const actual = vi.importActual('fs')
  return {
    default: {
      ...actual,
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
      readdirSync: vi.fn().mockReturnValue(['page.json']),
    },
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    readdirSync: vi.fn().mockReturnValue(['page.json']),
  }
})

vi.mock('path', () => {
  const pathMock = {
    join: (...args: string[]) => args.join('/').replace(/\/+/g, '/'),
    basename: (path: string) => path.split('/').pop() || '',
    dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
    resolve: (...args: string[]) => args.join('/').replace(/\/+/g, '/'),
  }
  return {
    default: pathMock,
    ...pathMock,
  }
})

// Экспортируем pathMock для использования в тестах
export const pathMock = {
  join: (...args: string[]) => args.join('/').replace(/\/+/g, '/'),
  basename: (path: string) => path.split('/').pop() || '',
  dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
  resolve: (...args: string[]) => args.join('/').replace(/\/+/g, '/'),
}

vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('format command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir = 'locales'
  const mockLocales = [
    { code: 'en' },
    { code: 'ru' },
    { code: 'de' },
  ]

  const createCommandContext = (args: {
    cwd?: string
    translationDir?: string
    indent?: string
    sortKeys?: boolean
    backup?: boolean
    logLevel?: string
  }) => ({
    args: {
      _: [],
      cwd: mockCwd,
      translationDir: mockTranslationDir,
      indent: '2',
      sortKeys: true,
      backup: false,
      logLevel: 'info',
      ...args,
    },
    rawArgs: [],
    cmd: formatCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === pathMock.join(mockCwd, mockTranslationDir)) return true
        if (path.endsWith('.json')) return true
        if (path.includes('/backups')) return false
        if (path.includes('/pages')) return true
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

  it('should format translations with sorted keys', async () => {
    const command = formatCommand
    if (!command) throw new Error('Command not found')

    const unsortedTranslations = {
      z_key: 'value3',
      a_key: 'value1',
      m_key: 'value2',
      nested: {
        z_nested: 'nested3',
        a_nested: 'nested1',
        m_nested: 'nested2',
      },
    }

    const sortedTranslations = {
      a_key: 'value1',
      m_key: 'value2',
      nested: {
        a_nested: 'nested1',
        m_nested: 'nested2',
        z_nested: 'nested3',
      },
      z_key: 'value3',
    }

    vi.mocked(loadJsonFile).mockReturnValue(unsortedTranslations)

    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что файлы были отформатированы с сортировкой ключей
    mockLocales.forEach((locale) => {
      expect(writeJsonFile).toHaveBeenCalledWith(
        pathMock.join(mockCwd, mockTranslationDir, `${locale.code}.json`),
        sortedTranslations,
      )
    })

    expect(consola.success).toHaveBeenCalledTimes(mockLocales.length * 2)
  })

  it('should format translations without sorting keys when sortKeys is false', async () => {
    const command = formatCommand
    if (!command) throw new Error('Command not found')

    const translations = {
      z_key: 'value3',
      a_key: 'value1',
      m_key: 'value2',
      nested: {
        z_nested: 'nested3',
        a_nested: 'nested1',
        m_nested: 'nested2',
      },
    }

    // Мокаем разные возвращаемые значения для разных вызовов
    let callCount = 0
    vi.mocked(loadJsonFile).mockImplementation(() => {
      callCount++
      if (callCount <= mockLocales.length) {
        return translations // Для глобальных переводов
      }
      return {} // Для переводов страниц
    })

    if (command.run) await command.run(createCommandContext({ sortKeys: false }))

    // Проверяем, что файлы были отформатированы без сортировки ключей
    mockLocales.forEach((locale) => {
      expect(writeJsonFile).toHaveBeenCalledWith(
        pathMock.join(mockCwd, mockTranslationDir, `${locale.code}.json`),
        translations,
      )
    })

    // Проверяем, что success был вызван для каждого файла (глобальные + страницы)
    expect(consola.success).toHaveBeenCalledTimes(mockLocales.length * 2)
  })

  it('should create backup files when backup option is enabled', async () => {
    const command = formatCommand
    if (!command) throw new Error('Command not found')

    const translations = {
      key1: 'value1',
      key2: 'value2',
    }

    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({ backup: true }))

    // Проверяем, что была создана директория для бэкапов
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      pathMock.join(mockCwd, mockTranslationDir, 'backups'),
      { recursive: true },
    )

    // Проверяем, что были созданы резервные копии для всех файлов
    expect(fs.copyFileSync).toHaveBeenCalledTimes(mockLocales.length * 2)

    // Проверяем, что writeJsonFile был вызван для обновления файлов
    expect(writeJsonFile).toHaveBeenCalledTimes(mockLocales.length * 2)
  })

  it('should handle missing translation files', async () => {
    const command = formatCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === pathMock.join(mockCwd, mockTranslationDir)) return true
        if (path.endsWith('en.json')) return true
        if (path.endsWith('ru.json')) return false
        if (path.endsWith('de.json')) return true
      }
      return false
    })

    const translations = {
      key1: 'value1',
      key2: 'value2',
    }

    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({}))

    expect(consola.warn).toHaveBeenCalledWith(
      'Translation file for locale ru does not exist.',
    )

    // Проверяем, что writeJsonFile был вызван только для существующих файлов
    expect(writeJsonFile).toHaveBeenCalledTimes(2) // en.json и de.json
  })

  it('should handle invalid JSON files', async () => {
    const command = formatCommand
    if (!command) throw new Error('Command not found')

    // Мокаем ошибку для первого вызова loadJsonFile
    vi.mocked(loadJsonFile).mockImplementationOnce(() => {
      throw new Error('Invalid JSON')
    })

    if (command.run) {
      await command.run(createCommandContext({}))

      // Проверяем, что ошибка была залогирована
      expect(consola.error).toHaveBeenCalledWith(
        expect.stringContaining('Error formatting translations for locale'),
        expect.any(Error),
      )

      // Проверяем, что команда продолжила работу
      expect(writeJsonFile).toHaveBeenCalled()
    }
  })

  it('should format page-specific translations', async () => {
    const command = formatCommand
    if (!command) throw new Error('Command not found')

    const pageTranslations = {
      z_key: 'value3',
      a_key: 'value1',
      m_key: 'value2',
    }

    const sortedPageTranslations = {
      a_key: 'value1',
      m_key: 'value2',
      z_key: 'value3',
    }

    // Мокаем разные возвращаемые значения для разных вызовов
    let callCount = 0
    vi.mocked(loadJsonFile).mockImplementation(() => {
      callCount++
      if (callCount <= mockLocales.length) {
        return {} // Для глобальных переводов
      }
      return pageTranslations // Для переводов страниц
    })

    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что файлы переводов страниц были отформатированы
    mockLocales.forEach((locale) => {
      expect(writeJsonFile).toHaveBeenCalledWith(
        pathMock.join(mockCwd, mockTranslationDir, 'pages', locale.code, 'page.json'),
        sortedPageTranslations,
      )
    })

    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining('Formatted translations for locale'),
    )
  })
})
