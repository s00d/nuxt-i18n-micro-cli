import type { PathLike } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import importCsvCommand from '../../src/commands/import-csv'

// Мокаем модули
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockImplementation((path: PathLike) => {
      if (path.toString().includes('/non-existent')) return false
      return true
    }),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn().mockImplementation((path: string) => {
      if (path.includes('invalid.csv')) {
        throw new Error('Invalid CSV file')
      }
      if (path.includes('en.csv')) {
        return `File,Key,Translation
en.json,greeting,Hello
en.json,welcome,Welcome
en.json,nested.message,Hello
en.json,nested.deep.text,Deep message
pages/page1/en.json,title,Page 1
pages/page1/en.json,content.header,Header
pages/page1/en.json,content.body,Body`
      }
      if (path.includes('ru.csv')) {
        return `File,Key,Translation
ru.json,greeting,Привет
ru.json,welcome,Добро пожаловать
ru.json,nested.message,Привет
ru.json,nested.deep.text,Глубокое сообщение
pages/page1/ru.json,title,Страница 1
pages/page1/ru.json,content.header,Заголовок
pages/page1/ru.json,content.body,Содержимое`
      }
      return ''
    }),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn().mockImplementation((path: PathLike) => {
    if (path.toString().includes('/non-existent')) return false
    return true
  }),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn().mockImplementation((path: string) => {
    if (path.includes('invalid.csv')) {
      throw new Error('Invalid CSV file')
    }
    if (path.includes('en.csv')) {
      return `File,Key,Translation
en.json,greeting,Hello
en.json,welcome,Welcome
en.json,nested.message,Hello
en.json,nested.deep.text,Deep message
pages/page1/en.json,title,Page 1
pages/page1/en.json,content.header,Header
pages/page1/en.json,content.body,Body`
    }
    if (path.includes('ru.csv')) {
      return `File,Key,Translation
ru.json,greeting,Привет
ru.json,welcome,Добро пожаловать
ru.json,nested.message,Привет
ru.json,nested.deep.text,Глубокое сообщение
pages/page1/ru.json,title,Страница 1
pages/page1/ru.json,content.header,Заголовок
pages/page1/ru.json,content.body,Содержимое`
    }
    return ''
  }),
  writeFileSync: vi.fn(),
}))

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn((path: string) => {
    if (path.includes('invalid')) {
      throw new Error('Invalid JSON')
    }
    if (path.includes('en.json') && !path.includes('pages')) {
      return {
        greeting: 'Old Hello',
        welcome: 'Old Welcome',
        nested: {
          message: 'Old Hello',
          deep: {
            text: 'Old Deep message',
          },
        },
      }
    }
    if (path.includes('ru.json') && !path.includes('pages')) {
      return {
        greeting: 'Старый Привет',
        welcome: 'Старое Добро пожаловать',
        nested: {
          message: 'Старый Привет',
          deep: {
            text: 'Старое Глубокое сообщение',
          },
        },
      }
    }
    if (path.includes('pages/page1/en.json')) {
      return {
        title: 'Old Page 1',
        content: {
          header: 'Old Header',
          body: 'Old Body',
        },
      }
    }
    if (path.includes('pages/page1/ru.json')) {
      return {
        title: 'Старая Страница 1',
        content: {
          header: 'Старый Заголовок',
          body: 'Старое Содержимое',
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

vi.mock('csv-parse/sync', () => ({
  parse: vi.fn((content: string, _options: any) => {
    const lines = content.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',')
    return lines.slice(1).map((line) => {
      const values = line.split(',')
      return {
        [headers[0]]: values[0],
        [headers[1]]: values[1],
        [headers[2]]: values[2],
      }
    })
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

describe('import-csv command', () => {
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
    const command = importCsvCommand as any
    return {
      args: { cwd, translationDir, csvDir, logLevel },
      command,
    }
  }

  it('should import translations from CSV files', async () => {
    const command = importCsvCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что были прочитаны CSV файлы
    const fs = await import('node:fs')
    expect(fs.default.readFileSync).toHaveBeenCalledTimes(2) // en и ru

    // Проверяем, что были обновлены JSON файлы
    const { writeJsonFile } = await import('../../src/utils/json')
    // Каждый файл обновляется для каждой записи в CSV
    // en.csv: 7 записей (4 в en.json + 3 в pages/page1/en.json)
    // ru.csv: 7 записей (4 в ru.json + 3 в pages/page1/ru.json)
    expect(writeJsonFile).toHaveBeenCalledTimes(14)

    // Проверяем, что были вызваны правильные методы для обновления переводов
    const { setNestedValue } = await import('../../src/utils/json')
    expect(setNestedValue).toHaveBeenCalledTimes(14) // 7 переводов для каждой локали

    // Проверяем успешные сообщения
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith(expect.stringContaining('Imported translations'))
  })

  it('should handle missing CSV files', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.default.existsSync).mockImplementationOnce(() => false)

    const command = importCsvCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем предупреждение о отсутствующем файле
    expect(vi.mocked(consola.warn)).toHaveBeenCalledWith(expect.stringContaining('CSV file not found'))
  })

  it('should handle invalid CSV files', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.default.readFileSync).mockImplementationOnce(() => {
      throw new Error('Invalid CSV file')
    })

    const command = importCsvCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({}))
      }
      catch (error) {
        expect(error).toBeDefined()
        expect(error.message).toBe('Invalid CSV file')
      }
    }
  })

  it('should handle invalid JSON files', async () => {
    const { loadJsonFile } = await import('../../src/utils/json')
    vi.mocked(loadJsonFile).mockImplementationOnce(() => {
      throw new Error('Invalid JSON')
    })

    const command = importCsvCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({}))
      }
      catch (error) {
        expect(error).toBeDefined()
        expect(error.message).toBe('Invalid JSON')
      }
    }
  })

  it('should create new JSON files if they do not exist', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.default.existsSync).mockImplementation((path: PathLike) => {
      // Возвращаем false для всех JSON файлов, чтобы имитировать их отсутствие
      if (path.toString().endsWith('.json')) return false
      return true
    })

    const command = importCsvCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что были созданы новые JSON файлы
    const { writeJsonFile } = await import('../../src/utils/json')
    // Каждый файл обновляется для каждой записи в CSV
    // en.csv: 7 записей (4 в en.json + 3 в pages/page1/en.json)
    // ru.csv: 7 записей (4 в ru.json + 3 в pages/page1/ru.json)
    expect(writeJsonFile).toHaveBeenCalledTimes(14)

    // Проверяем, что loadJsonFile не вызывался для несуществующих файлов
    const { loadJsonFile } = await import('../../src/utils/json')
    expect(loadJsonFile).not.toHaveBeenCalled()
  })
})
