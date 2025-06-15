import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import splitCommand from '../../src/commands/split'
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
    error: vi.fn(),
  },
}))

describe('split command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir = '/test/project/locales'
  const mockOutputDir = '/test/project/locales/split'
  const mockLocales = [
    { code: 'en' },
    { code: 'ru' },
    { code: 'de' },
  ]

  const createCommandContext = (args: {
    cwd?: string
    translationDir?: string
    logLevel?: string
    maxKeys?: string
    maxDepth?: string
    splitByPrefix?: boolean
    outputDir?: string
    backup?: boolean
  }) => ({
    args: {
      _: [],
      cwd: mockCwd,
      translationDir: mockTranslationDir,
      logLevel: 'info',
      maxKeys: '100',
      maxDepth: '2',
      splitByPrefix: false,
      outputDir: mockOutputDir,
      backup: false,
      ...args,
    },
    rawArgs: [],
    cmd: splitCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === mockTranslationDir) return true
        if (path === mockOutputDir) return false
        if (path.endsWith('.json')) return true
        if (path.includes('/backups')) return false
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

  it('should split translations by key count', async () => {
    const command = splitCommand
    if (!command) throw new Error('Command not found')

    const translations = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4',
      key5: 'value5',
    }

    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({ maxKeys: '2' }))

    // Проверяем, что была создана директория для разделенных файлов
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      `${mockOutputDir}/en`,
      { recursive: true },
    )

    // Проверяем, что каждый ключ был сохранен в отдельный файл
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/key1.json`,
      { key1: 'value1' },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/key2.json`,
      { key2: 'value2' },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/key3.json`,
      { key3: 'value3' },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/key4.json`,
      { key4: 'value4' },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/key5.json`,
      { key5: 'value5' },
    )

    // Проверяем, что процесс повторился для всех локалей
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/ru/key1.json`,
      { key1: 'value1' },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/de/key1.json`,
      { key1: 'value1' },
    )

    expect(vi.mocked(consola.success)).toHaveBeenCalledWith(
      'Split translations for locale en into 5 files',
    )
  })

  it('should split translations by depth', async () => {
    const command = splitCommand
    if (!command) throw new Error('Command not found')

    const translations = {
      section1: {
        key1: 'value1',
        key2: 'value2',
        nested: {
          key3: 'value3',
        },
      },
      section2: {
        key4: 'value4',
      },
    }

    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({ maxDepth: '1' }))

    // Проверяем, что файлы были разделены по глубине
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/section1.json`,
      {
        'section1.key1': 'value1',
        'section1.key2': 'value2',
        'section1.nested': { key3: 'value3' },
      },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/section2.json`,
      {
        'section2.key4': 'value4',
      },
    )
  })

  it('should split translations by prefix', async () => {
    const command = splitCommand
    if (!command) throw new Error('Command not found')

    const translations = {
      'common.title': 'Title',
      'common.description': 'Description',
      'about.title': 'About',
      'about.content': 'Content',
    }

    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({ splitByPrefix: true }))

    // Проверяем, что файлы были разделены по префиксу
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/common.json`,
      {
        'common.title': 'Title',
        'common.description': 'Description',
      },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/about.json`,
      {
        'about.title': 'About',
        'about.content': 'Content',
      },
    )
  })

  it('should create backup files when backup option is enabled', async () => {
    const command = splitCommand
    if (!command) throw new Error('Command not found')

    const translations = {
      key1: 'value1',
      key2: 'value2',
    }

    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({ backup: true }))

    // Проверяем, что была создана директория для бэкапов
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      `${mockTranslationDir}/backups`,
      { recursive: true },
    )

    // Проверяем, что была создана резервная копия
    expect(fs.copyFileSync).toHaveBeenCalled()
  })

  it('should handle missing translation files', async () => {
    const command = splitCommand
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

    if (command.run) await command.run(createCommandContext({}))

    expect(vi.mocked(consola.warn)).toHaveBeenCalledWith(
      'Translation file for locale ru does not exist.',
    )
  })

  it('should handle invalid translation files', async () => {
    const command = splitCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(loadJsonFile).mockReturnValue('invalid' as unknown as Record<string, unknown>)

    if (command.run) await command.run(createCommandContext({}))

    expect(vi.mocked(consola.error)).toHaveBeenCalledWith(
      'Invalid translation file format for locale en',
    )
  })

  it('should handle nested translations correctly', async () => {
    const command = splitCommand
    if (!command) throw new Error('Command not found')

    const translations = {
      section1: {
        subsection1: {
          key1: 'value1',
          key2: 'value2',
        },
        subsection2: {
          key3: 'value3',
        },
      },
      section2: {
        key4: 'value4',
      },
    }

    vi.mocked(loadJsonFile).mockReturnValue(translations)

    if (command.run) await command.run(createCommandContext({ maxKeys: '2' }))

    // Проверяем, что вложенные переводы были разделены по секциям
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/section1.json`,
      {
        'section1.subsection1.key1': 'value1',
        'section1.subsection1.key2': 'value2',
        'section1.subsection2.key3': 'value3',
      },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/en/section2.json`,
      {
        'section2.key4': 'value4',
      },
    )

    // Проверяем, что процесс повторился для всех локалей
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/ru/section1.json`,
      {
        'section1.subsection1.key1': 'value1',
        'section1.subsection1.key2': 'value2',
        'section1.subsection2.key3': 'value3',
      },
    )
    expect(writeJsonFile).toHaveBeenCalledWith(
      `${mockOutputDir}/ru/section2.json`,
      {
        'section2.key4': 'value4',
      },
    )
  })
})
