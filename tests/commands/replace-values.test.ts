import type { PathLike } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import replaceValuesCommand from '../../src/commands/replace-values'

// Мокаем модули
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockImplementation((path: PathLike) => {
      if (path.toString().includes('/non-existent')) return false
      return true
    }),
    readdirSync: vi.fn().mockImplementation((dir: string) => {
      if (dir.includes('pages')) return ['page1', 'page2']
      return []
    }),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn().mockImplementation((path: PathLike) => {
    if (path.toString().includes('/non-existent')) return false
    return true
  }),
  readdirSync: vi.fn().mockImplementation((dir: string) => {
    if (dir.includes('pages')) return ['page1', 'page2']
    return []
  }),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn((path: string) => {
    if (path.includes('invalid')) {
      throw new Error('Invalid JSON')
    }
    if (path.includes('en.json') && !path.includes('pages')) {
      return {
        greeting: 'Hello, world!',
        welcome: 'Welcome to our site',
        nested: {
          message: 'Hello from nested',
          deep: {
            text: 'Hello from deep nested',
          },
        },
      }
    }
    if (path.includes('ru.json') && !path.includes('pages')) {
      return {
        greeting: 'Привет, мир!',
        welcome: 'Добро пожаловать на наш сайт',
        nested: {
          message: 'Привет из вложенного',
          deep: {
            text: 'Привет из глубоко вложенного',
          },
        },
      }
    }
    if (path.includes('pages/page1/en.json')) {
      return {
        title: 'Page 1 Title',
        content: {
          header: 'Page 1 Header',
          body: 'Page 1 Body',
        },
      }
    }
    if (path.includes('pages/page1/ru.json')) {
      return {
        title: 'Заголовок страницы 1',
        content: {
          header: 'Заголовок страницы 1',
          body: 'Содержимое страницы 1',
        },
      }
    }
    if (path.includes('pages/page2/en.json')) {
      return {
        title: 'Page 2 Title',
        content: {
          header: 'Page 2 Header',
          body: 'Page 2 Body',
        },
      }
    }
    if (path.includes('pages/page2/ru.json')) {
      return {
        title: 'Заголовок страницы 2',
        content: {
          header: 'Заголовок страницы 2',
          body: 'Содержимое страницы 2',
        },
      }
    }
    return {}
  }),
  setNestedValue: vi.fn((obj: any, path: string, value: any) => {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }
    current[keys[keys.length - 1]] = value
  }),
  writeJsonFile: vi.fn(),
  flattenTranslations: vi.fn((obj: any) => {
    const result: Record<string, any> = {}
    const flatten = (current: any, path: string[] = []) => {
      for (const key in current) {
        const value = current[key]
        if (typeof value === 'object' && value !== null) {
          flatten(value, [...path, key])
        }
        else {
          result[[...path, key].join('.')] = value
        }
      }
    }
    flatten(obj)
    return result
  }),
}))

vi.mock('../../src/utils/kit', () => ({
  getI18nConfig: vi.fn().mockResolvedValue({
    locales: [
      { code: 'en', name: 'English' },
      { code: 'ru', name: 'Russian' },
    ],
    defaultLocale: 'en',
    translationDir: '/path/to/translations',
  }),
}))

// Мокаем consola
vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('replace-values command', () => {
  const mockTranslationDir = '/path/to/translations'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createCommandContext = ({
    cwd = '/test',
    translationDir = mockTranslationDir,
    search = 'test',
    replace = 'replaced',
    useRegex = false,
    logLevel = 'info',
  } = {}) => {
    const command = replaceValuesCommand as any
    return {
      args: { cwd, translationDir, search, replace, useRegex, logLevel },
      command,
    }
  }

  it('should replace simple text in translations', async () => {
    const command = replaceValuesCommand as any
    if (command.run) await command.run(createCommandContext({
      search: 'Hello',
      replace: 'Hi',
    }))

    // Проверяем, что были обновлены JSON файлы
    const { writeJsonFile } = await import('../../src/utils/json')
    expect(writeJsonFile).toHaveBeenCalledTimes(6) // 2 локали * (1 глобальный + 2 страничных файла)

    // Проверяем, что были вызваны правильные методы для обновления переводов
    const { setNestedValue } = await import('../../src/utils/json')
    expect(setNestedValue).toHaveBeenCalledWith(
      expect.any(Object),
      'greeting',
      'Hi, world!',
    )

    // Проверяем успешные сообщения
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith('Translation values have been updated.')
  })

  it('should replace text using regex', async () => {
    const command = replaceValuesCommand as any
    if (command.run) await command.run(createCommandContext({
      search: 'Hello.*',
      replace: 'Hi there',
      useRegex: true,
    }))

    // Проверяем, что были обновлены JSON файлы
    const { writeJsonFile } = await import('../../src/utils/json')
    expect(writeJsonFile).toHaveBeenCalledTimes(6)

    // Проверяем, что были вызваны правильные методы для обновления переводов
    const { setNestedValue } = await import('../../src/utils/json')
    expect(setNestedValue).toHaveBeenCalledWith(
      expect.any(Object),
      'greeting',
      'Hi there',
    )

    // Проверяем успешные сообщения
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith('Translation values have been updated.')
  })

  it('should replace text using regex groups', async () => {
    const command = replaceValuesCommand as any
    if (command.run) await command.run(createCommandContext({
      search: '(Hello), (world)!',
      replace: '$2, $1!',
      useRegex: true,
    }))

    // Проверяем, что были обновлены JSON файлы
    const { writeJsonFile } = await import('../../src/utils/json')
    expect(writeJsonFile).toHaveBeenCalledTimes(6)

    // Проверяем, что были вызваны правильные методы для обновления переводов
    const { setNestedValue } = await import('../../src/utils/json')
    expect(setNestedValue).toHaveBeenCalledWith(
      expect.any(Object),
      'greeting',
      'world, Hello!',
    )

    // Проверяем успешные сообщения
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith('Translation values have been updated.')
  })

  it('should handle non-existent files', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.default.existsSync).mockImplementation((path: PathLike) => {
      if (path.toString().includes('/non-existent')) return false
      return true
    })

    const command = replaceValuesCommand as any
    if (command.run) await command.run(createCommandContext({
      translationDir: '/non-existent',
    }))

    // Проверяем, что writeJsonFile не вызывался
    const { writeJsonFile } = await import('../../src/utils/json')
    expect(writeJsonFile).not.toHaveBeenCalled()

    // Проверяем успешные сообщения
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith('Translation values have been updated.')
  })

  it('should handle nested translations', async () => {
    const command = replaceValuesCommand as any
    if (command.run) await command.run(createCommandContext({
      search: 'nested',
      replace: 'updated',
    }))

    // Проверяем, что были обновлены JSON файлы
    const { writeJsonFile } = await import('../../src/utils/json')
    expect(writeJsonFile).toHaveBeenCalledTimes(6)

    // Проверяем, что были вызваны правильные методы для обновления переводов
    const { setNestedValue } = await import('../../src/utils/json')
    expect(setNestedValue).toHaveBeenCalledWith(
      expect.any(Object),
      'nested.message',
      'Hello from updated',
    )
    expect(setNestedValue).toHaveBeenCalledWith(
      expect.any(Object),
      'nested.deep.text',
      'Hello from deep updated',
    )

    // Проверяем успешные сообщения
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith('Translation values have been updated.')
  })
})
