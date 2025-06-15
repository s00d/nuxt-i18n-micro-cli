import type { Dirent, PathLike } from 'node:fs'
import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import statsCommand from '../../src/commands/stats'
import { getI18nConfig } from '../../src/utils/kit'

vi.mock('../../src/utils/kit')
vi.mock('process', () => ({
  exit: vi.fn(),
}))

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    statSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  statSync: vi.fn(),
}))

vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    default: {
      ...actual,
      join: (...args: string[]) => args.join('/'),
      resolve: (...args: string[]) => args.join('/'),
      basename: (path: string, ext?: string) => {
        const name = path.split('/').pop() || ''
        return ext ? name.replace(ext, '') : name
      },
      dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
      relative: (from: string, to: string) => {
        const fromParts = from.split('/')
        const toParts = to.split('/')
        let i = 0
        while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
          i++
        }
        return toParts.slice(i).join('/')
      },
    },
    join: (...args: string[]) => args.join('/'),
    resolve: (...args: string[]) => args.join('/'),
    basename: (path: string, ext?: string) => {
      const name = path.split('/').pop() || ''
      return ext ? name.replace(ext, '') : name
    },
    dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
    relative: (from: string, to: string) => {
      const fromParts = from.split('/')
      const toParts = to.split('/')
      let i = 0
      while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
        i++
      }
      return toParts.slice(i).join('/')
    },
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

describe('stats command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir = 'locales'
  const mockLocales = [
    { code: 'en' },
    { code: 'ru' },
  ]

  const mockFiles = {
    'en.json': {
      content: {
        common: {
          welcome: 'Welcome',
          buttons: {
            save: 'Save',
            cancel: 'Cancel',
          },
          longKey: 'This is a very long translation value that should be detected as one of the longest values',
          duplicateValue: 'Same value',
          duplicateValue2: 'Same value',
          specialChars: 'Hello! @#$%^&*()',
          formattingIssues: '  Multiple spaces  and\nnewlines',
          htmlContent: '<p>Hello <strong>world</strong> with <a href="#">link</a></p>',
          variableContent: 'Hello {name}, you have {count} messages',
          mixedCase: 'This is a Mixed Case Text',
          numbers: 42,
          boolean: true,
          array: ['item1', 'item2'],
          object: { key: 'value' },
          emoji: 'Hello 👋 World 🌍',
          currency: 'Price: $100, €50, ¥1000',
          repeatedWords: 'The quick brown fox jumps over the lazy fox',
        },
      },
    },
    'ru.json': {
      content: {
        common: {
          welcome: 'Добро пожаловать',
          buttons: {
            save: 'Сохранить',
            cancel: '', // Пустое значение для тестирования
          },
          longKey: 'Это очень длинное значение перевода, которое должно быть определено как одно из самых длинных значений',
          duplicateValue: 'Одинаковое значение',
          duplicateValue2: 'Одинаковое значение',
          specialChars: 'Привет! @#$%^&*()',
          formattingIssues: '  Множественные пробелы  и\nпереносы строк',
          htmlContent: '<p>Привет <strong>мир</strong> с <a href="#">ссылкой</a></p>',
          variableContent: 'Привет, {name}, у вас {count} сообщений',
          mixedCase: 'Это Текст В Смешанном Регистре',
          numbers: 42,
          boolean: true,
          array: ['элемент1', 'элемент2'],
          object: { key: 'значение' },
          emoji: 'Привет 👋 Мир 🌍',
          currency: 'Цена: $100, €50, ¥1000',
          repeatedWords: 'Быстрая коричневая лиса прыгает через ленивую лису',
        },
      },
    },
    'pages/home/en.json': {
      content: {
        title: 'Home',
        description: 'Welcome to our site',
        longContent: 'This is a very long page content that should be detected in page statistics',
        emptyValue: '',
      },
    },
    'pages/home/ru.json': {
      content: {
        title: 'Главная',
        description: '', // Пустое значение для тестирования
        longContent: 'Это очень длинное содержимое страницы, которое должно быть определено в статистике страницы',
        emptyValue: '',
      },
    },
  }

  const createCommandContext = (args: {
    cwd?: string
    translationDir?: string
    full?: boolean
    html?: string
    logLevel?: string
  }) => ({
    args: {
      _: [],
      cwd: mockCwd,
      translationDir: mockTranslationDir,
      full: false,
      html: '',
      logLevel: 'info',
      ...args,
    },
    rawArgs: [],
    cmd: statsCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockReturnValue(true)

    // Создаем моки для Dirent
    const mockDirents: Record<string, Dirent[]> = {
      [mockTranslationDir]: [
        { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'ru.json', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
      [`${mockTranslationDir}/pages`]: [
        { name: 'home', isDirectory: () => true, isFile: () => false } as Dirent,
      ],
      [`${mockTranslationDir}/pages/home`]: [
        { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'ru.json', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
    }

    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      return mockDirents[pathStr] || []
    })

    // Мок для чтения файлов
    vi.mocked(fs.readFileSync).mockImplementation((path: PathLike | number) => {
      if (typeof path === 'number') {
        throw new TypeError('File descriptor not supported in tests')
      }
      const pathStr = String(path)
      const file = mockFiles[pathStr.split('/').slice(-2).join('/')] || mockFiles[pathStr.split('/').pop() || '']
      return file ? JSON.stringify(file.content) : '{}'
    })

    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: mockLocales,
      translationDir: mockTranslationDir,
      defaultLocale: 'en',
    })
  })

  it('should display combined translation statistics', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({}))

    // Проверяем вывод общей статистики
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Combined translations: en - Total keys: \d+, Translated keys: \d+, Completion: \d+\.\d+%/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Combined translations: ru - Total keys: \d+, Translated keys: \d+, Completion: \d+\.\d+%/),
    )
  })

  it('should display detailed statistics when full option is enabled', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ full: true }))

    // Проверяем существующие метрики
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Locale: en/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Locale: ru/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Global Translations:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Average Key Length:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Average Value Length:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Special Characters:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Empty Values:/))

    // Проверяем новые метрики
    // Типы значений
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Value Types:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Strings:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Numbers:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Booleans:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Arrays:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Objects:/))

    // Длина строк
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/String Lengths:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Short \(0-10\):/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Medium \(11-50\):/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Long \(51-100\):/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Very Long \(>100\):/))

    // HTML теги
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/HTML Tags:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Total Tags:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Most Used Tags:/))

    // Переменные
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Variables:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Total Variables:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Examples:/))

    // Специальные символы
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Special Characters:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Punctuation:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Emoji:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Currency:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Other:/))

    // Статистика слов
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Word Statistics:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Total Words:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Unique Words:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Average Word Length:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Most Repeated Words:/))

    // Статистика регистра
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Case Statistics:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Upper Case:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Lower Case:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Title Case:/))
    expect(consola.info).toHaveBeenCalledWith(expect.stringMatching(/Mixed Case:/))
  })

  it('should handle missing translation directory', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(fs.existsSync).mockReturnValueOnce(false)

    if (command.run) {
      await expect(command.run(createCommandContext({
        translationDir: '/non-existent',
      }))).rejects.toThrow('Translation directory does not exist')
    }
  })

  it('should handle missing page translations', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    // Мокаем отсутствие файла перевода для страницы
    vi.mocked(fs.existsSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      if (pathStr.includes('pages/home/ru.json')) {
        return false
      }
      return true
    })

    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что статистика все равно выводится
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Combined translations: ru - Total keys: \d+, Translated keys: \d+, Completion: \d+\.\d+%/),
    )
  })

  it('should generate HTML report when html option is provided', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    const htmlPath = 'translation-stats.html'
    if (command.run) await command.run(createCommandContext({ html: htmlPath }))

    // Проверяем, что файл был создан
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/translation-stats\.html$/),
      expect.any(String),
    )

    // Проверяем содержимое HTML-отчета
    const htmlContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string

    // Проверяем наличие основных секций
    expect(htmlContent).toContain('<title>Translation Statistics Report</title>')
    expect(htmlContent).toContain('<h1>Translation Statistics Report</h1>')
    expect(htmlContent).toContain('<div class="summary">')
    expect(htmlContent).toContain('<h2>Summary</h2>')

    // Проверяем наличие статистики по локалям
    expect(htmlContent).toContain('Locale: en')
    expect(htmlContent).toContain('Locale: ru')

    // Проверяем наличие метрик
    expect(htmlContent).toContain('Global Translations')
    expect(htmlContent).toContain('Page Translations')
    expect(htmlContent).toContain('Basic Statistics')
    expect(htmlContent).toContain('Length Analysis')

    // Проверяем наличие предупреждений
    expect(htmlContent).toContain('Duplicate Values')
    expect(htmlContent).toContain('Formatting Issues')

    // Проверяем наличие прогресс-баров
    expect(htmlContent).toContain('class="progress-bar"')
    expect(htmlContent).toContain('class="progress"')

    // Проверяем сообщение об успешной генерации
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringMatching(/HTML report generated:/),
    )
  })

  it('should handle empty translation files', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    // Сохраняем оригинальную реализацию мока
    const originalMock = vi.mocked(fs.readFileSync).mockImplementation

    // Мокаем пустой файл перевода для всех вызовов
    vi.mocked(fs.readFileSync).mockImplementation((path: PathLike | number) => {
      if (typeof path === 'number') {
        throw new TypeError('File descriptor not supported in tests')
      }
      return '{}'
    })

    if (command.run) await command.run(createCommandContext({ full: true }))

    // Проверяем, что статистика выводится с нулевыми значениями
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Total Keys: 0/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Translated Keys: 0/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Completion: 0\.00%/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Average Key Length: 0\.00/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Average Value Length: 0\.00/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Special Characters: 0/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Empty Values: 0/),
    )

    // Восстанавливаем оригинальную реализацию мока
    vi.mocked(fs.readFileSync).mockImplementation = originalMock
  })

  it('should handle invalid JSON files', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    // Сохраняем оригинальную реализацию мока
    const originalMock = vi.mocked(fs.readFileSync).mockImplementation

    // Мокаем невалидный JSON файл для всех вызовов
    vi.mocked(fs.readFileSync).mockImplementation((path: PathLike | number) => {
      if (typeof path === 'number') {
        throw new TypeError('File descriptor not supported in tests')
      }
      return '{invalid json}'
    })

    if (command.run) await command.run(createCommandContext({ full: true }))

    // Проверяем, что статистика выводится с нулевыми значениями
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Total Keys: 0/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Translated Keys: 0/),
    )
    expect(consola.info).toHaveBeenCalledWith(
      expect.stringMatching(/Completion: 0\.00%/),
    )

    // Проверяем, что ошибка была залогирована
    expect(consola.error).toHaveBeenCalledWith(
      expect.stringMatching(/Error parsing JSON file/),
      expect.any(Error),
    )

    // Восстанавливаем оригинальную реализацию мока
    vi.mocked(fs.readFileSync).mockImplementation = originalMock
  })

  it('should correctly analyze value types', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ full: true }))

    // Проверяем, что в выводе есть информация о типах значений
    const output = vi.mocked(consola.info).mock.calls
      .map(call => call[0])
      .join('\n')

    // Проверяем наличие строк
    expect(output).toMatch(/Strings: \d+/)
    // Проверяем наличие чисел
    expect(output).toMatch(/Numbers: \d+/)
    // Проверяем наличие булевых значений
    expect(output).toMatch(/Booleans: \d+/)
    // Проверяем наличие массивов
    expect(output).toMatch(/Arrays: \d+/)
    // Проверяем наличие объектов
    expect(output).toMatch(/Objects: \d+/)
  })

  it('should correctly analyze HTML tags and variables', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ full: true }))

    const output = vi.mocked(consola.info).mock.calls
      .map(call => call[0])
      .join('\n')

    // Проверяем наличие HTML тегов
    expect(output).toMatch(/Total Tags: \d+/)
    expect(output).toMatch(/p:/)
    expect(output).toMatch(/strong:/)
    expect(output).toMatch(/a:/)

    // Проверяем наличие переменных
    expect(output).toMatch(/Total Variables: \d+/)
    expect(output).toMatch(/common\.variableContent: name, count/)
  })

  it('should correctly analyze special characters and case', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ full: true }))

    const output = vi.mocked(consola.info).mock.calls
      .map(call => call[0])
      .join('\n')

    // Проверяем наличие специальных символов
    expect(output).toMatch(/Punctuation: \d+/)
    expect(output).toMatch(/Emoji: \d+/)
    expect(output).toMatch(/Currency: \d+/)
    expect(output).toMatch(/Other: \d+/)

    // Проверяем статистику регистра
    expect(output).toMatch(/Upper Case: \d+/)
    expect(output).toMatch(/Lower Case: \d+/)
    expect(output).toMatch(/Title Case: \d+/)
    expect(output).toMatch(/Mixed Case: \d+/)
  })

  it('should correctly analyze word statistics', async () => {
    const command = statsCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ full: true }))

    const output = vi.mocked(consola.info).mock.calls
      .map(call => call[0])
      .join('\n')

    // Проверяем статистику слов
    expect(output).toMatch(/Total Words: \d+/)
    expect(output).toMatch(/Unique Words: \d+/)
    expect(output).toMatch(/Average Word Length: \d+\.\d+/)
    expect(output).toMatch(/Most Repeated Words:/)
    expect(output).toMatch(/a: \d+ times/)
    expect(output).toMatch(/value: \d+ times/)
    expect(output).toMatch(/hello: \d+ times/)
  })
})
