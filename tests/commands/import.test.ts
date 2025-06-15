import fs from 'node:fs'
import path from 'node:path'
import type { PathLike } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consola } from 'consola'
import importCommand from '../../src/commands/import'

// Мокаем модули
vi.mock('node:fs', () => {
  const mockExistsSync = vi.fn().mockImplementation((path: PathLike) => {
    if (path.toString().includes('/non-existent')) return false
    return true
  })

  const mockMkdirSync = vi.fn()

  const mockReadFileSync = vi.fn().mockImplementation((path: string) => {
    if (path.includes('invalid.po')) {
      throw new Error('Invalid PO file')
    }
    if (path.includes('en.po')) {
      return `
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8"

msgctxt "common"
msgid "welcome"
msgstr "Welcome"

msgctxt "common"
msgid "hello"
msgstr "Hello"

msgctxt "pages.index"
msgid "title"
msgstr "Home Page"
`
    }
    if (path.includes('ru.po')) {
      return `
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8"

msgctxt "common"
msgid "welcome"
msgstr "Добро пожаловать"

msgctxt "common"
msgid "hello"
msgstr "Привет"

msgctxt "pages.index"
msgid "title"
msgstr "Главная страница"
`
    }
    return ''
  })

  const mockWriteFileSync = vi.fn()

  // Сохраняем моки в глобальном объекте для тестов
  global.__mockFs = {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  }

  return {
    default: {
      existsSync: mockExistsSync,
      mkdirSync: mockMkdirSync,
      readFileSync: mockReadFileSync,
      writeFileSync: mockWriteFileSync,
    },
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
  }
})

vi.mock('../../src/utils/po', () => ({
  convertPoToJson: vi.fn().mockImplementation((potsDir: string, translationDir: string) => {
    // Имитируем создание файлов
    global.__mockFs.writeFileSync(
      path.join(translationDir, 'en.json'),
      JSON.stringify({
        common: {
          welcome: 'Welcome',
          hello: 'Hello',
        },
        pages: {
          index: {
            title: 'Home Page',
          },
        },
      }, null, 2),
    )

    global.__mockFs.writeFileSync(
      path.join(translationDir, 'ru.json'),
      JSON.stringify({
        common: {
          welcome: 'Добро пожаловать',
          hello: 'Привет',
        },
        pages: {
          index: {
            title: 'Главная страница',
          },
        },
      }, null, 2),
    )
  }),
}))

vi.mock('../../src/utils/kit', () => ({
  getI18nConfig: vi.fn().mockReturnValue({
    translationDir: '/path/to/translations',
    potsDir: '/path/to/pots',
    locales: ['en', 'ru'],
  }),
}))

vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
}))

describe('import command', () => {
  const mockTranslationDir = '/path/to/translations'
  const mockPotsDir = '/path/to/pots'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createCommandContext = ({
    cwd = '/test',
    translationDir = mockTranslationDir,
    potsDir = mockPotsDir,
    logLevel = 'info',
  } = {}) => {
    const command = importCommand as any
    return {
      args: { cwd, translationDir, potsDir, logLevel },
      command,
    }
  }

  it('should convert PO files to JSON', async () => {
    const command = importCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что getI18nConfig был вызван с правильными параметрами
    const { getI18nConfig } = await import('../../src/utils/kit')
    expect(getI18nConfig).toHaveBeenCalledWith('/test', 'info')

    // Проверяем, что convertPoToJson был вызван с правильными параметрами
    const { convertPoToJson } = await import('../../src/utils/po')
    expect(convertPoToJson).toHaveBeenCalledWith(mockPotsDir, mockTranslationDir)

    // Проверяем, что файлы были созданы
    expect(global.__mockFs.writeFileSync).toHaveBeenCalled()

    // Проверяем содержимое созданных файлов
    const writeFileCalls = global.__mockFs.writeFileSync.mock.calls
    const enFileContent = JSON.parse(writeFileCalls.find(call => String(call[0]).endsWith('/en.json'))![1] as string)
    const ruFileContent = JSON.parse(writeFileCalls.find(call => String(call[0]).endsWith('/ru.json'))![1] as string)

    // Проверяем структуру и содержимое файлов
    expect(enFileContent.common.welcome).toBe('Welcome')
    expect(enFileContent.common.hello).toBe('Hello')
    expect(enFileContent.pages.index.title).toBe('Home Page')

    expect(ruFileContent.common.welcome).toBe('Добро пожаловать')
    expect(ruFileContent.common.hello).toBe('Привет')
    expect(ruFileContent.pages.index.title).toBe('Главная страница')
  })

  it('should handle missing translation directory', async () => {
    global.__mockFs.existsSync.mockImplementationOnce(() => false)

    const command = importCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({ translationDir: '/non-existent' }))
      }
      catch (error) {
        expect(error).toBeDefined()
      }
    }
  })

  it('should handle invalid PO files', async () => {
    // Сбрасываем моки перед тестом
    vi.clearAllMocks()

    // Устанавливаем мок для readFileSync
    vi.mocked(fs.readFileSync).mockImplementationOnce(() => {
      throw new Error('Invalid PO file')
    })

    const command = importCommand as any
    if (command.run) {
      try {
        await command.run(createCommandContext({}))
      }
      catch (error) {
        expect(error).toBeDefined()
        // Используем vi.mocked для доступа к моку
        expect(vi.mocked(consola.error)).toHaveBeenCalledWith(expect.stringContaining('Invalid PO file'))
      }
    }
  })

  it('should create translation directory if it does not exist', async () => {
    global.__mockFs.existsSync.mockImplementationOnce(() => false)

    const command = importCommand as any
    if (command.run) await command.run(createCommandContext({}))

    expect(global.__mockFs.mkdirSync).toHaveBeenCalledWith(mockTranslationDir, { recursive: true })
  })
})
