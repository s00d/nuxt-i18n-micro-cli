import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import extractCommand from '../../src/commands/extract'
import * as extractTranslations from '../../src/utils/components'
import * as jsonUtils from '../../src/utils/json'
import * as i18nConfig from '../../src/utils/kit'

vi.mock('node:fs')
vi.mock('../../src/utils/components')
vi.mock('../../src/utils/json')
vi.mock('../../src/utils/kit')

describe('extract command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir = '/test/project/locales'

  const createCommandContext = (args: { cwd?: string, translationDir?: string, logLevel?: string, prod?: boolean } = {}) => ({
    args: {
      _: ['extract'],
      cwd: mockCwd,
      translationDir: mockTranslationDir,
      logLevel: 'info',
      prod: false,
      ...args,
    },
    rawArgs: ['extract'],
    cmd: extractCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Мокаем fs.existsSync для директории переводов
    vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr === `${mockTranslationDir}/en.json`) return true
      if (pathStr === `${mockTranslationDir}/ru.json`) return true
      return false
    })
    // Мокаем fs.readFileSync для файлов переводов
    vi.mocked(fs.readFileSync).mockImplementation((path: fs.PathOrFileDescriptor) => {
      const pathStr = path.toString()
      if (pathStr === `${mockTranslationDir}/en.json`) return JSON.stringify({ title: 'Title' })
      if (pathStr === `${mockTranslationDir}/ru.json`) return JSON.stringify({ title: 'Заголовок' })
      return '{}'
    })
  })

  it('should extract translations and save them to JSON files', async () => {
    const command = extractCommand as any
    if (!command.run) throw new Error('Command not found')

    // Мокаем getI18nConfig
    vi.mocked(i18nConfig.getI18nConfig).mockResolvedValue({
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDir: 'locales',
      defaultLocale: 'en',
    })

    // Мокаем extractTranslations
    const mockTranslations = {
      pageSpecific: {
        index: new Set(['page.title', 'page.content']),
        about: new Set(['about.title', 'about.description']),
      },
      global: new Set(['common.welcome', 'common.hello']),
      components: {},
    }
    vi.mocked(extractTranslations.extractTranslations).mockReturnValue(mockTranslations)

    // Мокаем convertToNestedObjects
    vi.mocked(jsonUtils.convertToNestedObjects).mockImplementation((keys) => {
      const result: Record<string, unknown> = {}
      keys.forEach((key) => {
        const parts = key.split('.')
        let current = result
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          current[part] = current[part] || {}
          current = current[part] as Record<string, unknown>
        }
        current[parts[parts.length - 1]] = key
      })
      return result
    })

    // Мокаем loadJsonFile для существующих переводов
    vi.mocked(jsonUtils.loadJsonFile).mockImplementation((path: string) => {
      if (path === `${mockTranslationDir}/en.json`) return { title: 'Title' }
      if (path === `${mockTranslationDir}/ru.json`) return { title: 'Заголовок' }
      return {}
    })

    await command.run(createCommandContext())

    // Проверяем, что getI18nConfig был вызван с правильными параметрами
    expect(i18nConfig.getI18nConfig).toHaveBeenCalledWith(mockCwd, 'info')

    // Проверяем, что extractTranslations был вызван с правильным путем
    expect(extractTranslations.extractTranslations).toHaveBeenCalledWith(mockCwd)

    // Проверяем, что convertToNestedObjects был вызван для глобальных переводов
    expect(jsonUtils.convertToNestedObjects).toHaveBeenCalledWith(mockTranslations.global)

    // Проверяем, что файлы были созданы
    const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls
    expect(writeFileCalls.length).toBe(6) // Обновляем ожидаемое количество файлов

    // Проверяем, что пути к файлам правильные
    const filePaths = writeFileCalls.map(call => call[0].toString())
    expect(filePaths).toContain(`${mockTranslationDir}/en.json`)
    expect(filePaths).toContain(`${mockTranslationDir}/ru.json`)
    expect(filePaths).toContain(`${mockTranslationDir}/pages/index/en.json`)
    expect(filePaths).toContain(`${mockTranslationDir}/pages/index/ru.json`)
    expect(filePaths).toContain(`${mockTranslationDir}/pages/about/en.json`)
    expect(filePaths).toContain(`${mockTranslationDir}/pages/about/ru.json`)
  })

  it('should handle missing translation directory', async () => {
    const command = extractCommand as any
    if (!command.run) throw new Error('Command not found')

    // Мокаем fs.existsSync для отсутствующей директории
    vi.mocked(fs.existsSync).mockReturnValue(false)

    // Мокаем getI18nConfig
    vi.mocked(i18nConfig.getI18nConfig).mockResolvedValue({
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDir: 'locales',
      defaultLocale: 'en',
    })

    // Мокаем extractTranslations
    const mockTranslations = {
      pageSpecific: {},
      global: new Set(['common.welcome']),
      components: {},
    }
    vi.mocked(extractTranslations.extractTranslations).mockReturnValue(mockTranslations)

    // Мокаем convertToNestedObjects
    vi.mocked(jsonUtils.convertToNestedObjects).mockImplementation((keys) => {
      const result: Record<string, unknown> = {}
      keys.forEach((key) => {
        const parts = key.split('.')
        let current = result
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          current[part] = current[part] || {}
          current = current[part] as Record<string, unknown>
        }
        current[parts[parts.length - 1]] = key
      })
      return result
    })

    // Мокаем loadJsonFile для пустых переводов
    vi.mocked(jsonUtils.loadJsonFile).mockReturnValue({})

    await command.run(createCommandContext())

    // Проверяем, что директория была создана
    expect(fs.mkdirSync).toHaveBeenCalledWith(mockTranslationDir, { recursive: true })

    // Проверяем, что файлы были созданы
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2) // 2 файла для глобальных переводов

    // Проверяем, что пути к файлам правильные
    const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls
    const filePaths = writeFileCalls.map(call => call[0].toString())
    expect(filePaths).toContain(`${mockTranslationDir}/en.json`)
    expect(filePaths).toContain(`${mockTranslationDir}/ru.json`)
  })

  it('should handle errors during extraction', async () => {
    const command = extractCommand as any
    if (!command.run) throw new Error('Command not found')

    // Мокаем getI18nConfig для выброса ошибки
    vi.mocked(i18nConfig.getI18nConfig).mockImplementation(() => {
      throw new Error('Failed to get i18n config')
    })

    // Мокаем loadJsonFile для пустых переводов
    vi.mocked(jsonUtils.loadJsonFile).mockReturnValue({})

    await expect(command.run(createCommandContext())).rejects.toThrow('Failed to get i18n config')
  })

  it('should preserve existing translations', async () => {
    const command = extractCommand as any
    if (!command.run) throw new Error('Command not found')

    // Мокаем getI18nConfig
    vi.mocked(i18nConfig.getI18nConfig).mockResolvedValue({
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDir: 'locales',
      defaultLocale: 'en',
    })

    // Мокаем extractTranslations
    const mockTranslations = {
      pageSpecific: {},
      global: new Set(['common.welcome', 'common.hello']),
      components: {},
    }
    vi.mocked(extractTranslations.extractTranslations).mockReturnValue(mockTranslations)

    // Мокаем convertToNestedObjects
    vi.mocked(jsonUtils.convertToNestedObjects).mockImplementation((keys) => {
      const result: Record<string, unknown> = {}
      keys.forEach((key) => {
        const parts = key.split('.')
        let current = result
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          current[part] = current[part] || {}
          current = current[part] as Record<string, unknown>
        }
        current[parts[parts.length - 1]] = key
      })
      return result
    })

    // Мокаем loadJsonFile для существующих переводов
    vi.mocked(jsonUtils.loadJsonFile).mockImplementation((path: string) => {
      if (path === `${mockTranslationDir}/en.json`) {
        return {
          title: 'Title',
          common: {
            welcome: 'Welcome',
          },
        }
      }
      if (path === `${mockTranslationDir}/ru.json`) {
        return {
          title: 'Заголовок',
          common: {
            welcome: 'Добро пожаловать',
          },
        }
      }
      return {}
    })

    await command.run(createCommandContext())

    // Проверяем, что файлы были созданы с сохранением существующих переводов
    const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls
    const enFileContent = JSON.parse(writeFileCalls.find(call => call[0].toString() === `${mockTranslationDir}/en.json`)![1] as string)
    const ruFileContent = JSON.parse(writeFileCalls.find(call => call[0].toString() === `${mockTranslationDir}/ru.json`)![1] as string)

    // Проверяем, что существующие переводы сохранены
    expect(enFileContent.title).toBe('Title')
    expect(enFileContent.common.welcome).toBe('Welcome')
    expect(ruFileContent.title).toBe('Заголовок')
    expect(ruFileContent.common.welcome).toBe('Добро пожаловать')

    // Проверяем, что новые переводы добавлены
    expect(enFileContent.common).toEqual({
      welcome: 'Welcome',
      hello: 'common.hello',
    })
    expect(ruFileContent.common).toEqual({
      welcome: 'Добро пожаловать',
      hello: 'common.hello',
    })
  })
})
