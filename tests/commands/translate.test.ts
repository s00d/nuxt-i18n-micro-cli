import type { PathLike, Dirent } from 'node:fs'
import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import type { Mock } from 'vitest'
import translateCommand from '../../src/commands/translate'

// Мокаем модули
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}))

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn(),
  writeJsonFile: vi.fn(),
  getNestedValue: vi.fn(),
  setNestedValue: vi.fn(),
  parseOptions: vi.fn(),
}))

vi.mock('../../src/utils/kit', () => ({
  getI18nConfig: vi.fn(),
}))

vi.mock('../../src/utils/translate', () => ({
  translateText: vi.fn(),
}))

vi.mock('prompts', () => ({
  default: vi.fn(),
}))

vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}))

describe('translate command', () => {
  let loadJsonFile: Mock
  let writeJsonFile: Mock
  let getNestedValue: Mock
  let setNestedValue: Mock
  let parseOptions: Mock
  let getI18nConfig: Mock
  let translateText: Mock

  beforeEach(async () => {
    vi.clearAllMocks()

    const jsonUtils = await import('../../src/utils/json')
    const kitUtils = await import('../../src/utils/kit')
    const translateUtils = await import('../../src/utils/translate')

    loadJsonFile = jsonUtils.loadJsonFile as Mock
    writeJsonFile = jsonUtils.writeJsonFile as Mock
    getNestedValue = jsonUtils.getNestedValue as Mock
    setNestedValue = jsonUtils.setNestedValue as Mock
    parseOptions = jsonUtils.parseOptions as Mock
    getI18nConfig = kitUtils.getI18nConfig as Mock
    translateText = translateUtils.translateText as Mock

    // Мокаем конфигурацию i18n
    getI18nConfig.mockResolvedValue({
      locales: [
        { code: 'en', name: 'English' },
        { code: 'ru', name: 'Russian' },
      ],
      defaultLocale: 'en',
      translationDir: 'locales',
    })

    // Мокаем существование директории с переводами
    vi.mocked(fs.existsSync).mockImplementation((path: PathLike) => {
      return path.toString().includes('locales')
    })

    // Мокаем список файлов в директории
    const mockDirents: Record<string, Dirent[]> = {
      'locales': [
        { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'ru.json', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
      'locales/pages': [
        { name: 'page1.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'page2.json', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
    }

    vi.mocked(fs.readdirSync).mockImplementation((dir: PathLike, options?: { withFileTypes?: boolean }) => {
      const dirStr = dir.toString()
      if (options?.withFileTypes) {
        return (mockDirents[dirStr] || []) as Dirent[]
      }
      else {
        return (mockDirents[dirStr] || []).map(d => ({ ...d, name: d.name, isDirectory: () => false, isFile: () => true })) as Dirent[]
      }
    })

    // Мокаем содержимое файлов
    loadJsonFile.mockImplementation((path: string) => {
      if (path.includes('custom')) {
        return {}
      }
      if (path.includes('en.json')) {
        return {
          hello: 'Hello World',
          welcome: 'Welcome',
          nested: {
            message: 'Hello from nested',
          },
        }
      }
      if (path.includes('ru.json')) {
        return {
          hello: 'Привет Мир',
          nested: {
            message: 'Привет из вложенного',
          },
        }
      }
      return {}
    })

    // Мокаем функции для работы с вложенными значениями
    getNestedValue.mockImplementation((obj: any, key: string) => {
      const keys = key.split('.')
      let value = obj
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k]
        }
        else {
          return undefined
        }
      }
      return value
    })

    setNestedValue.mockImplementation((obj: any, key: string, value: any) => {
      const keys = key.split('.')
      let current = obj
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (!(k in current)) {
          current[k] = {}
        }
        current = current[k]
      }
      current[keys[keys.length - 1]] = value
    })

    // Мокаем функцию перевода
    translateText.mockImplementation(async (text: string, fromLang: string, _toLang: string) => {
      const translations: Record<string, Record<string, string>> = {
        en: {
          'Hello World': 'Привет Мир',
          'Welcome': 'Добро пожаловать',
          'Hello from nested': 'Привет из вложенного',
        },
        ru: {
          'Привет Мир': 'Hello World',
          'Добро пожаловать': 'Welcome',
          'Привет из вложенного': 'Hello from nested',
        },
      }
      return translations[fromLang]?.[text] || text
    })

    // Мокаем prompts
    const prompts = (await import('prompts')).default as unknown as Mock
    prompts.mockImplementation(async (options: any) => {
      if (options.name === 'service') {
        return { service: 'google' }
      }
      if (options.name === 'token') {
        return { token: 'test-token' }
      }
      return {}
    })
  })

  const createCommandContext = (args: Partial<{ translationDir: string, service: string, token: string, options: string, replace: boolean, cwd: string, logLevel: string }> = {}) => ({
    args: {
      _: [],
      translationDir: 'locales',
      service: '',
      token: '',
      options: '',
      replace: false,
      cwd: process.cwd(),
      logLevel: 'info',
      ...args,
    },
    rawArgs: [],
    cmd: translateCommand,
  })

  it('should translate missing keys', async () => {
    const command = translateCommand
    await command.run?.(createCommandContext({
      service: 'google',
      token: 'test-token',
    }))

    // Проверяем, что были вызваны необходимые функции
    expect(fs.existsSync).toHaveBeenCalled()
    expect(fs.readdirSync).toHaveBeenCalled()
    expect(loadJsonFile).toHaveBeenCalled()
    expect(translateText).toHaveBeenCalled()
    expect(writeJsonFile).toHaveBeenCalled()
  })

  it('should prompt for service if not provided', async () => {
    const command = translateCommand
    await command.run?.(createCommandContext({}))

    const prompts = (await import('prompts')).default as unknown as Mock
    expect(prompts).toHaveBeenCalledWith(expect.objectContaining({
      name: 'service',
      message: 'Choose a translation service',
    }))
  })

  it('should prompt for token if not provided', async () => {
    const command = translateCommand
    await command.run?.(createCommandContext({
      service: 'google',
    }))

    const prompts = (await import('prompts')).default as unknown as Mock
    expect(prompts).toHaveBeenCalledWith(expect.objectContaining({
      name: 'token',
      message: expect.stringContaining('Enter API key for google'),
    }))
  })

  it('should handle translation errors gracefully', async () => {
    translateText.mockRejectedValueOnce(new Error('Translation failed'))

    const command = translateCommand
    await command.run?.(createCommandContext({
      service: 'google',
      token: 'test-token',
    }))

    expect(consola.error).toHaveBeenCalledWith(expect.stringContaining('Translation failed'))
  })

  it('should respect replace flag', async () => {
    const command = translateCommand
    await command.run?.(createCommandContext({
      service: 'google',
      token: 'test-token',
      replace: true,
    }))

    // Проверяем, что все ключи были переведены, включая существующие
    expect(translateText).toHaveBeenCalledTimes(3)
    expect(writeJsonFile).toHaveBeenCalled()
  })

  it('should handle custom translation service options', async () => {
    parseOptions.mockReturnValue({ format: 'html', model: 'base' })

    const command = translateCommand
    await command.run?.(createCommandContext({
      service: 'google',
      token: 'test-token',
      options: 'format:html,model:base',
    }))

    expect(parseOptions).toHaveBeenCalledWith('format:html,model:base')
    expect(translateText).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      { format: 'html', model: 'base' },
    )
  })

  it('should handle invalid JSON files', async () => {
    loadJsonFile.mockImplementationOnce(() => {
      throw new Error('Invalid JSON')
    })

    const command = translateCommand
    await expect(command.run?.(createCommandContext({
      service: 'google',
      token: 'test-token',
    }))).rejects.toThrow('Invalid JSON')
  })

  it('should handle custom translation directory', async () => {
    // Мокаем существование директории
    vi.mocked(fs.existsSync).mockImplementation((path: PathLike) => {
      const pathStr = path.toString()
      return pathStr.includes('custom') || pathStr.includes('locales')
    })

    // Мокаем список файлов в директории
    const mockDirents: Record<string, Dirent[]> = {
      custom: [
        { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'ru.json', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
    }

    // Создаем отдельные моки для разных сигнатур readdirSync
    const mockReaddirSync = vi.fn()
    mockReaddirSync.mockImplementation((path: PathLike, options?: { withFileTypes?: boolean }) => {
      const dirStr = path.toString()
      if (options?.withFileTypes) {
        return mockDirents[dirStr] || []
      }
      return (mockDirents[dirStr] || []).map(d => d.name)
    })

    // Применяем мок к fs.readdirSync
    vi.mocked(fs.readdirSync).mockImplementation(mockReaddirSync)

    // Мокаем содержимое файлов
    loadJsonFile.mockImplementation((path: string) => {
      if (path.includes('custom/en.json')) {
        return {
          hello: 'Hello World',
          welcome: 'Welcome',
        }
      }
      if (path.includes('custom/ru.json')) {
        return {
          hello: 'Привет Мир',
        }
      }
      return {}
    })

    const command = translateCommand
    await command.run?.(createCommandContext({
      service: 'google',
      token: 'test-token',
      translationDir: 'custom',
    }))

    expect(loadJsonFile).toHaveBeenCalledWith(expect.stringContaining('custom/en.json'))
    expect(loadJsonFile).toHaveBeenCalledWith(expect.stringContaining('custom/ru.json'))
    expect(translateText).toHaveBeenCalled()
    expect(writeJsonFile).toHaveBeenCalled()
  })
})
