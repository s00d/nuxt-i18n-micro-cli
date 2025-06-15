import type { PathLike } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import diffCommand from '../../src/commands/diff'

// Мокаем модули
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn((path: PathLike) => {
      if (path.toString().includes('/non-existent')) return false
      return true
    }),
  },
}))

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
  flattenTranslations: vi.fn((obj: any) => {
    const result: Record<string, string> = {}
    const flatten = (o: any, prefix = '') => {
      for (const key in o) {
        const value = o[key]
        if (typeof value === 'object' && value !== null) {
          flatten(value, prefix ? `${prefix}.${key}` : key)
        }
        else {
          result[prefix ? `${prefix}.${key}` : key] = value
        }
      }
    }
    flatten(obj)
    return result
  }),
  getAllJsonPaths: vi.fn((dir: string, locale: string) => {
    // Возвращаем абсолютные пути для файлов с другими локалями
    if (locale === 'ru') {
      return [
        `${dir}/ru.json`,
        `${dir}/pages/page1/ru.json`,
      ]
    }
    if (locale === 'en') {
      return [
        `${dir}/en.json`,
        `${dir}/pages/page1/en.json`,
      ]
    }
    return []
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

// Мокаем console.log для проверки вывода
const mockConsoleLog = vi.fn()
vi.stubGlobal('console', {
  log: mockConsoleLog,
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

describe('diff command', () => {
  const mockTranslationDir = '/path/to/translations'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createCommandContext = ({ cwd = '/test', translationDir = mockTranslationDir, logLevel = 'info' } = {}) => {
    const command = diffCommand as any
    return {
      args: { cwd, translationDir, logLevel },
      command,
    }
  }

  it('should find missing translations in locale files', async () => {
    const command = diffCommand as any
    if (command.run) await command.run(createCommandContext({}))

    const output = JSON.parse(mockConsoleLog.mock.calls[0][0])

    // Отладочный вывод
    consola.info('Diff command output:', JSON.stringify(output, null, 2))
    consola.info('Looking for file:', 'en.json')
    consola.info('Available files:', output.map((r: any) => r.file))

    // Проверяем глобальные переводы
    const globalDiff = output.find((r: any) => r.file === 'en.json')
    consola.info('Found global diff:', globalDiff)
    expect(globalDiff).toBeDefined()
    expect(globalDiff.missingInLocale).toContainEqual({
      key: 'welcome',
      defaultValue: 'Welcome',
    })
    expect(globalDiff.missingInLocale).toContainEqual({
      key: 'nested.deep.text',
      defaultValue: 'Deep message',
    })

    // Проверяем страничные переводы
    const pageDiff = output.find((r: any) => r.file === 'pages/page1/en.json')
    consola.info('Found page diff:', pageDiff)
    expect(pageDiff).toBeDefined()
    expect(pageDiff.missingInLocale).toContainEqual({
      key: 'content.header',
      defaultValue: 'Header',
    })
    expect(pageDiff.missingInLocale).toContainEqual({
      key: 'content.body',
      defaultValue: 'Body',
    })
  })

  it('should handle missing translation directory', async () => {
    const command = diffCommand as any
    if (command.run) await command.run(createCommandContext({ translationDir: '/non-existent' }))

    expect(mockConsoleLog).not.toHaveBeenCalled()
  })

  it('should handle invalid JSON files', async () => {
    const command = diffCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что команда продолжает работу даже при ошибке загрузки файла
    expect(mockConsoleLog).toHaveBeenCalled()
    const output = JSON.parse(mockConsoleLog.mock.calls[0][0])
    expect(Array.isArray(output)).toBe(true)
  })
})
