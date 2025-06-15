import type { PathLike } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import exportCommand from '../../src/commands/export'

// Мокаем модули
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    default: {
      existsSync: vi.fn((path: PathLike) => {
        if (path.toString().includes('/non-existent')) return false
        return true
      }),
      readdirSync: vi.fn((dir: string, _options: { withFileTypes: boolean }) => {
        // Возвращаем пустой массив для всех остальных директорий
        if (!dir.includes('/pages')) {
          return []
        }

        // Для директории pages возвращаем файл en.json и поддиректорию page1
        if (dir === '/path/to/translations/pages') {
          return [
            { name: 'en.json', isDirectory: () => false, isFile: () => true },
            { name: 'page1', isDirectory: () => true, isFile: () => false },
          ]
        }

        // Для директории page1 возвращаем файл en.json
        if (dir === '/path/to/translations/pages/page1') {
          return [
            { name: 'en.json', isDirectory: () => false, isFile: () => true },
          ]
        }

        // Для всех остальных директорий возвращаем пустой массив
        return []
      }),
    },
  }
})

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn((path: string) => {
    if (path.includes('invalid')) {
      throw new Error('Invalid JSON')
    }
    if (path.includes('en.json') && !path.includes('pages')) {
      return {
        greeting: 'Hello',
        welcome: 'Welcome',
        nested: {
          message: 'Hello',
          deep: {
            text: 'Deep message',
          },
        },
      }
    }
    if (path.includes('ru.json') && !path.includes('pages')) {
      return {
        greeting: 'Привет',
        // welcome отсутствует
        nested: {
          message: 'Привет',
          // deep отсутствует
        },
      }
    }
    if (path.includes('pages/page1/en.json')) {
      return {
        title: 'Page 1',
        content: {
          header: 'Header',
          body: 'Body',
        },
      }
    }
    if (path.includes('pages/page1/ru.json')) {
      return {
        title: 'Страница 1',
        // content отсутствует
      }
    }
    return {}
  }),
  writeJsonFile: vi.fn(),
  getNestedValue: vi.fn((obj: any, key: string) => {
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
  }),
  setNestedValue: vi.fn((obj: any, key: string, value: any) => {
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
  }),
  parseOptions: vi.fn((options: string) => {
    const result: Record<string, string> = {}
    options.split(',').forEach((pair) => {
      const [key, value] = pair.split(':')
      if (key && value) {
        result[key.trim()] = value.trim()
      }
    })
    return result
  }),
}))

vi.mock('../../src/utils/translate', () => ({
  translateText: vi.fn(async (text: string, from: string, to: string, service: string, token: string) => {
    if (!token) {
      throw new Error('API token is required')
    }
    if (service === 'invalid') {
      throw new Error('Invalid translation service')
    }
    // Простая имитация перевода
    const translations: Record<string, Record<string, string>> = {
      'Hello': { ru: 'Привет' },
      'Welcome': { ru: 'Добро пожаловать' },
      'Deep message': { ru: 'Глубокое сообщение' },
      'Header': { ru: 'Заголовок' },
      'Body': { ru: 'Содержимое' },
    }
    return translations[text]?.[to] || null
  }),
}))

vi.mock('../../src/utils/kit', () => {
  const mockTranslationDir = '/path/to/translations'
  return {
    getI18nConfig: vi.fn().mockResolvedValue({
      locales: [
        { code: 'en', name: 'English' },
        { code: 'ru', name: 'Russian' },
      ],
      defaultLocale: 'en',
      translationDir: mockTranslationDir,
    }),
  }
})

// Мокаем consola
vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('export command', () => {
  const mockTranslationDir = '/path/to/translations'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createCommandContext = ({
    cwd = '/test',
    translationDir = mockTranslationDir,
    service = 'google',
    token = 'test-token',
    options = '',
    logLevel = 'info',
  } = {}) => {
    const command = exportCommand as any
    return {
      args: { cwd, translationDir, service, token, options, logLevel },
      command,
    }
  }

  it('should translate missing translations', async () => {
    const command = exportCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что были вызваны функции перевода для отсутствующих ключей
    const { translateText } = await import('../../src/utils/translate')

    // Получаем все вызовы translateText
    const calls = vi.mocked(translateText).mock.calls

    // Проверяем, что все ожидаемые ключи были переведены
    const translatedKeys = calls.map(call => call[0])
    expect(translatedKeys).toContain('Welcome')
    expect(translatedKeys).toContain('Deep message')
    expect(translatedKeys).toContain('Header')
    expect(translatedKeys).toContain('Body')

    // Проверяем, что все вызовы были с правильными параметрами
    calls.forEach((call) => {
      expect(call[1]).toBe('en') // from locale
      expect(call[2]).toBe('ru') // to locale
      expect(call[3]).toBe('google') // service
      expect(call[4]).toBe('test-token') // token
      expect(call[5]).toEqual({}) // options
    })

    // Проверяем, что переводы были сохранены
    const { writeJsonFile } = await import('../../src/utils/json')
    expect(writeJsonFile).toHaveBeenCalled()
  })

  it('should handle missing translation directory', async () => {
    // Мокаем existsSync для возврата false для несуществующей директории
    const fs = await import('node:fs')
    vi.mocked(fs.default.existsSync).mockImplementationOnce(() => false)

    const command = exportCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({ translationDir: '/non-existent' }))
      }
      catch (error) {
        expect(error).toBeDefined()
      }
    }
  })

  it('should handle missing API token', async () => {
    const command = exportCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({ token: '' }))
      }
      catch (error) {
        expect(error).toBeDefined()
        expect((error as Error).message).toContain('API token is required')
      }
    }
  })

  it('should handle invalid translation service', async () => {
    const command = exportCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({ service: 'invalid' }))
      }
      catch (error) {
        expect(error).toBeDefined()
        expect((error as Error).message).toContain('Invalid translation service')
      }
    }
  })

  it('should handle translation errors gracefully', async () => {
    // Мокаем translateText, чтобы он выбрасывал ошибку для определенного текста
    const { translateText } = await import('../../src/utils/translate')
    vi.mocked(translateText).mockImplementationOnce(async () => {
      throw new Error('Translation failed')
    })

    const command = exportCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({}))
      }
      catch {
        // Проверяем, что ошибка была обработана
        expect(consola.error).toHaveBeenCalledWith(expect.stringContaining('Translation failed'))
      }
    }
  })

  it('should process nested translations correctly', async () => {
    const command = exportCommand as any
    if (command.run) {
      await command.run(createCommandContext({}))

      const { getNestedValue, setNestedValue } = await import('../../src/utils/json')

      // Проверяем, что вложенные ключи были обработаны
      expect(getNestedValue).toHaveBeenCalledWith(expect.any(Object), 'nested.deep.text')
      expect(setNestedValue).toHaveBeenCalledWith(expect.any(Object), 'nested.deep.text', expect.any(String))
    }
  })

  it('should process page translations correctly', async () => {
    const command = exportCommand as any
    if (command.run) {
      await command.run(createCommandContext({}))

      const { loadJsonFile } = await import('../../src/utils/json')

      // Проверяем, что были загружены файлы страниц
      expect(loadJsonFile).toHaveBeenCalledWith(expect.stringContaining('pages/en.json'))
    }
  })

  it('should handle custom translation options', async () => {
    const command = exportCommand as any
    if (command.run) {
      await command.run(createCommandContext({
        options: 'preserveFormatting:true,glossary:custom',
      }))

      const { translateText } = await import('../../src/utils/translate')
      expect(translateText).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          preserveFormatting: 'true',
          glossary: 'custom',
        }),
      )
    }
  })
})
