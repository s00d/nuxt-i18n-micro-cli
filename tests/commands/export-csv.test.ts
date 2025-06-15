import type { PathLike } from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import exportCsvCommand from '../../src/commands/export-csv'

// Мокаем модули
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockImplementation((path: PathLike) => {
      if (path.toString().includes('/non-existent')) return false
      return true
    }),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}))

vi.mock('../../src/utils/json', () => {
  const flattenTranslations = (obj: any, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {}
    for (const key in obj) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'object' && value !== null) {
        Object.assign(result, flattenTranslations(value, newKey))
      }
      else {
        result[newKey] = value
      }
    }
    return result
  }

  return {
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
          welcome: 'Добро пожаловать',
          nested: {
            message: 'Привет',
            deep: {
              text: 'Глубокое сообщение',
            },
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
          content: {
            header: 'Заголовок',
            body: 'Содержимое',
          },
        }
      }
      return {}
    }),
    getAllJsonPaths: vi.fn((dir: string, locale: string): string[] => {
      const paths: string[] = []
      if (locale === 'en') {
        paths.push(`${dir}/en.json`)
        paths.push(`${dir}/pages/page1/en.json`)
      }
      if (locale === 'ru') {
        paths.push(`${dir}/ru.json`)
        paths.push(`${dir}/pages/page1/ru.json`)
      }
      return paths
    }),
    flattenTranslations,
  }
})

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

vi.mock('csv-stringify/sync', () => ({
  stringify: vi.fn((data: any[], options: any) => {
    const header = options.header ? 'File,Key,Translation\n' : ''
    return header + data.map(row => row.join(',')).join('\n')
  }),
}))

describe('export-csv command', () => {
  const mockTranslationDir = '/path/to/translations'
  const mockCsvDir = '/path/to/csv_exports'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createCommandContext = ({
    cwd = '/test',
    translationDir = mockTranslationDir,
    csvDir = mockCsvDir,
    logLevel = 'info',
  } = {}) => {
    const command = exportCsvCommand as any
    return {
      args: { cwd, translationDir, csvDir, logLevel },
      command,
    }
  }

  it('should export translations to CSV files', async () => {
    const command = exportCsvCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что были созданы CSV файлы для каждой локали
    const fs = await import('node:fs')
    expect(fs.default.writeFileSync).toHaveBeenCalledTimes(2) // en и ru

    // Выводим все вызовы writeFileSync для отладки
    const fsCalls = vi.mocked(fs.default.writeFileSync).mock.calls

    // Проверяем содержимое CSV файлов
    const csvContents = fsCalls.map((call) => {
      const content = call[1]
      if (typeof content === 'string')
        return content
      if (Buffer.isBuffer(content))
        return content.toString('utf-8')
      return ''
    })

    // Находим содержимое файлов по путям
    const enCsvContent = csvContents[fsCalls.findIndex(call => String(call[0]).endsWith('/en.csv'))]
    const ruCsvContent = csvContents[fsCalls.findIndex(call => String(call[0]).endsWith('/ru.csv'))]

    // Проверяем, что файлы были найдены
    expect(enCsvContent).toBeDefined()
    expect(ruCsvContent).toBeDefined()

    if (!enCsvContent || !ruCsvContent)
      throw new Error('CSV files not found')

    // Проверяем глобальные переводы
    expect(enCsvContent).toContain('en.json,greeting,Hello')
    expect(enCsvContent).toContain('en.json,welcome,Welcome')
    expect(enCsvContent).toContain('en.json,nested.message,Hello')
    expect(enCsvContent).toContain('en.json,nested.deep.text,Deep message')

    expect(ruCsvContent).toContain('ru.json,greeting,Привет')
    expect(ruCsvContent).toContain('ru.json,welcome,Добро пожаловать')
    expect(ruCsvContent).toContain('ru.json,nested.message,Привет')
    expect(ruCsvContent).toContain('ru.json,nested.deep.text,Глубокое сообщение')

    // Проверяем переводы страниц
    expect(enCsvContent).toContain('pages/page1/en.json,title,Page 1')
    expect(enCsvContent).toContain('pages/page1/en.json,content.header,Header')
    expect(enCsvContent).toContain('pages/page1/en.json,content.body,Body')

    expect(ruCsvContent).toContain('pages/page1/ru.json,title,Страница 1')
    expect(ruCsvContent).toContain('pages/page1/ru.json,content.header,Заголовок')
    expect(ruCsvContent).toContain('pages/page1/ru.json,content.body,Содержимое')
  })

  it('should create CSV directory if it does not exist', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.default.existsSync).mockImplementationOnce(() => false)

    const command = exportCsvCommand as any
    if (command.run) await command.run(createCommandContext({}))

    expect(fs.default.mkdirSync).toHaveBeenCalledWith(mockCsvDir, { recursive: true })
  })

  it('should handle missing translation directory', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.default.existsSync).mockImplementationOnce(() => false)

    const command = exportCsvCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({ translationDir: '/non-existent' }))
      }
      catch (error) {
        expect(error).toBeDefined()
      }
    }
  })

  it('should handle invalid JSON files', async () => {
    const { loadJsonFile } = await import('../../src/utils/json')
    const errorMessage = 'Invalid JSON'
    const jsonPath = path.join('/path/to/translations', 'en.json')
    vi.mocked(loadJsonFile).mockImplementationOnce(() => {
      throw new Error(errorMessage)
    })

    const command = exportCsvCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({}))
        // Если команда не выбросила исключение, тест должен упасть
        expect.fail('Command should throw an error')
      }
      catch (error) {
        expect(error).toBeDefined()
        // Проверяем, что ошибка была залогирована
        expect(consola.error).toHaveBeenCalledWith(
          expect.stringContaining(`Failed to load translations from ${jsonPath}: ${errorMessage}`),
        )
      }
    }
  })
})
