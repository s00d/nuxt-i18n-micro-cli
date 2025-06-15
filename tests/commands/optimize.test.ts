import type { Dirent, Stats, PathLike } from 'node:fs'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import glob from 'glob'
import optimizeCommand, { analyzeFiles } from '../../src/commands/optimize'
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
    prompt: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('glob', () => ({
  default: {
    sync: vi.fn(),
  },
  sync: vi.fn(),
}))

vi.mock('../../src/commands/optimize', async () => {
  const actual = await vi.importActual('../../src/commands/optimize')
  return {
    ...actual,
    analyzeFiles: vi.fn().mockReturnValue({
      totalFiles: 3,
      totalSize: 4608,
      averageSize: 1536,
      largeFiles: [
        { path: 'locales/en.json', size: 2048, content: {}, keys: [] },
        { path: 'locales/ru.json', size: 2048, content: {}, keys: [] },
      ],
      deepNestingFiles: [],
      duplicateKeysFiles: [],
    }),
  }
})

describe('optimize command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir: string = 'locales'
  const mockLocales = [
    { code: 'en' },
    { code: 'ru' },
    { code: 'de' },
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
        },
        pages: {
          home: {
            title: 'Home',
            description: 'Welcome to our site',
          },
        },
      },
      size: 2048, // 2KB
    },
    'ru.json': {
      content: {
        common: {
          welcome: 'Добро пожаловать',
          buttons: {
            save: 'Сохранить',
            cancel: 'Отмена',
          },
        },
        pages: {
          home: {
            title: 'Главная',
            description: 'Добро пожаловать на наш сайт',
          },
        },
      },
      size: 2048, // 2KB
    },
    'duplicate.json': {
      content: {
        common: {
          welcome: 'Welcome',
          welcome_de: 'Willkommen',
        },
      },
      size: 512, // 512B
    },
  }

  const mockVueFiles = {
    'components/TestComponent.vue': `
<template>
  <div>
    <h1>{{ $t('common.welcome') }}</h1>
    <p>{{ $t('pages.home.title') }}</p>
    <button>{{ $t('common.buttons.save') }}</button>
  </div>
</template>
    `,
    'pages/index.vue': `
<template>
  <div>
    <h1>{{ $t('pages.home.title') }}</h1>
    <p>{{ $t('pages.home.description') }}</p>
  </div>
</template>
    `,
  }

  const createCommandContext = (args: Partial<{
    translationDir: string
    minSize: string
    maxDepth: string
    dryRun: boolean
    updatePaths: boolean
    cwd: string
    logLevel: string
  }> = {}) => ({
    args: {
      _: [],
      translationDir: 'locales',
      minSize: '1024',
      maxDepth: '3',
      dryRun: false,
      updatePaths: true,
      cwd: process.cwd(),
      logLevel: 'info',
      ...args,
    },
    rawArgs: [],
    cmd: optimizeCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockReturnValue(true)
    // Сбрасываем мок consola.prompt на значение по умолчанию
    vi.mocked(consola.prompt).mockResolvedValue(true)

    // Создаем моки для Dirent
    const mockDirents: Record<string, Dirent[]> = {
      [mockTranslationDir]: [
        { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'ru.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'duplicate.json', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
      components: [
        { name: 'TestComponent.vue', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
      pages: [
        { name: 'index.vue', isDirectory: () => false, isFile: () => true } as Dirent,
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
      const fileName = pathStr.split('/').pop() || ''

      // Проверяем Vue файлы
      if (fileName.endsWith('.vue')) {
        return mockVueFiles[pathStr as keyof typeof mockVueFiles] || ''
      }

      // Проверяем JSON файлы
      const file = mockFiles[fileName as keyof typeof mockFiles]
      return file ? JSON.stringify(file.content) : '{}'
    })

    // Мок для statSync
    vi.mocked(fs.statSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      const fileName = pathStr.split('/').pop() || ''
      const file = mockFiles[fileName as keyof typeof mockFiles]
      return {
        size: file?.size || 0,
        isDirectory: () => false,
        isFile: () => true,
        dev: 0,
        ino: 0,
        mode: 0,
        nlink: 0,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 0,
        blocks: 0,
        atimeMs: 0,
        mtimeMs: 0,
        ctimeMs: 0,
        birthtimeMs: 0,
        atime: new Date(),
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      } as Stats
    })

    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: mockLocales,
      translationDir: mockTranslationDir,
      defaultLocale: 'en',
    })
  })

  it('should show analysis without making changes in dry run mode', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    // Мокаем glob для поиска Vue файлов
    vi.mocked(glob.sync).mockReturnValue([])

    // Мокаем анализ файлов для dry run
    vi.mocked(analyzeFiles).mockReturnValue({
      totalFiles: 3,
      totalSize: 4608,
      averageSize: 1536,
      largeFiles: [
        { path: 'locales/en.json', size: 2048, content: mockFiles['en.json'].content, keys: [] },
        { path: 'locales/ru.json', size: 2048, content: mockFiles['ru.json'].content, keys: [] },
      ],
      deepNestingFiles: [],
      duplicateKeysFiles: [],
    })

    if (command.run) await command.run(createCommandContext({ dryRun: true }))

    expect(consola.info).toHaveBeenCalledWith('Translation files analysis:')
    expect(consola.info).toHaveBeenCalledWith('Total files: 3')
    expect(consola.info).toHaveBeenCalledWith('Total size: 4.5 KB')
    expect(consola.info).toHaveBeenCalledWith('Average file size: 1.5 KB')
    expect(consola.info).toHaveBeenCalledWith('Files over 1.0 KB: 2')
    expect(consola.info).toHaveBeenCalledWith('Files with deep nesting: 0')
    expect(consola.info).toHaveBeenCalledWith('Files with duplicate keys: 0')
    expect(consola.info).toHaveBeenCalledWith('\nLarge files that could be split:')
    expect(consola.info).toHaveBeenCalledWith('- en.json (2.0 KB)')
    expect(consola.info).toHaveBeenCalledWith('- ru.json (2.0 KB)')
    expect(consola.info).toHaveBeenCalledWith('\nDry run mode: no changes were made')
    expect(fs.writeFileSync).not.toHaveBeenCalled()
    expect(fs.unlinkSync).not.toHaveBeenCalled()
  })

  it('should optimize large files by splitting them', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    // Мокаем подтверждение пользователя
    vi.mocked(consola.prompt).mockResolvedValueOnce(true)

    // Мокаем glob для поиска Vue файлов
    vi.mocked(glob.sync).mockReturnValue([])

    // Мокаем анализ файлов, чтобы показать большие файлы
    vi.mocked(analyzeFiles).mockReturnValue({
      totalFiles: 2,
      totalSize: 4096,
      averageSize: 2048,
      largeFiles: [
        {
          path: path.join(mockTranslationDir, 'en.json'),
          size: 2048,
          content: mockFiles['en.json'].content,
          keys: ['common.welcome', 'common.buttons.save', 'common.buttons.cancel', 'pages.home.title', 'pages.home.description'],
        },
        {
          path: path.join(mockTranslationDir, 'ru.json'),
          size: 2048,
          content: mockFiles['ru.json'].content,
          keys: ['common.welcome', 'common.buttons.save', 'common.buttons.cancel', 'pages.home.title', 'pages.home.description'],
        },
      ],
      deepNestingFiles: [],
      duplicateKeysFiles: [],
    })

    // Мокаем existsSync для проверки существования директорий
    vi.mocked(fs.existsSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      // Возвращаем false для поддиректорий, чтобы mkdirSync был вызван
      if (pathStr.endsWith('/en') || pathStr.endsWith('/ru')) {
        return false
      }
      // Возвращаем true для основной директории и файлов
      return true
    })

    if (command.run) await command.run(createCommandContext({}))

    // Проверяем создание директорий для разделенных файлов
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join(mockTranslationDir, 'en'),
      { recursive: true },
    )
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join(mockTranslationDir, 'ru'),
      { recursive: true },
    )

    // Проверяем запись разделенных файлов
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockTranslationDir, 'en', 'common.json'),
      expect.stringContaining('"welcome": "Welcome"'),
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockTranslationDir, 'en', 'pages.json'),
      expect.stringContaining('"title": "Home"'),
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockTranslationDir, 'ru', 'common.json'),
      expect.stringContaining('"welcome": "Добро пожаловать"'),
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockTranslationDir, 'ru', 'pages.json'),
      expect.stringContaining('"title": "Главная"'),
    )

    // Проверяем удаление оригинальных файлов
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(mockTranslationDir, 'en.json'))
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(mockTranslationDir, 'ru.json'))
  })

  it('should remove duplicate keys', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    // Подготавливаем тестовые данные с явными дубликатами значений
    const duplicateContent = {
      common: {
        welcome: 'Welcome',
        welcome_de: 'Welcome', // Дубликат значения
        welcome_ru: 'Welcome', // Еще один дубликат
      },
    }

    // Мокаем все необходимые функции
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      if (pathStr === mockTranslationDir) {
        return [
          { name: 'duplicate.json', isDirectory: () => false, isFile: () => true } as Dirent,
        ]
      }
      return []
    })

    vi.mocked(fs.readFileSync).mockImplementation((path: PathLike | number) => {
      if (typeof path === 'number') throw new TypeError('File descriptor not supported')
      const pathStr = String(path)
      if (pathStr === `${mockTranslationDir}/duplicate.json`) {
        return JSON.stringify(duplicateContent)
      }
      return '{}'
    })

    vi.mocked(fs.statSync).mockImplementation(() => ({
      size: 512,
      isDirectory: () => false,
      isFile: () => true,
    } as Stats))

    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(consola.prompt).mockResolvedValue(true)
    vi.mocked(glob.sync).mockReturnValue([])

    // Мокаем analyzeFiles для возврата файла с дубликатами
    vi.mocked(analyzeFiles).mockReturnValue({
      totalFiles: 1,
      totalSize: 512,
      averageSize: 512,
      largeFiles: [],
      deepNestingFiles: [],
      duplicateKeysFiles: [
        {
          path: `${mockTranslationDir}/duplicate.json`,
          size: 512,
          content: duplicateContent,
          keys: ['common.welcome', 'common.welcome_de', 'common.welcome_ru'],
          duplicateKeys: ['common.welcome_de', 'common.welcome_ru'],
        },
      ],
    })

    // Очищаем моки перед запуском
    vi.clearAllMocks()

    // Запускаем команду
    if (command.run) await command.run(createCommandContext({ updatePaths: false }))

    // Проверяем результат
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${mockTranslationDir}/duplicate.json`,
      expect.stringMatching(/"common":\s*\{\s*"welcome":\s*"Welcome"\s*\}/),
    )
  })

  it('should update translation paths in Vue files after splitting large files', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    const translationContent = {
      common: {
        welcome: 'Welcome',
      },
      pages: {
        home: {
          title: 'Home',
        },
      },
    }

    // Мокаем все необходимые функции
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      if (pathStr === mockTranslationDir) {
        return [
          { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        ]
      }
      if (pathStr === `${mockTranslationDir}/en`) {
        return [
          { name: 'common.json', isDirectory: () => false, isFile: () => true } as Dirent,
          { name: 'pages.json', isDirectory: () => false, isFile: () => true } as Dirent,
        ]
      }
      return []
    })

    // Мокаем glob для поиска Vue файлов
    vi.mocked(glob.sync).mockImplementation((pattern: string | string[], options?: any) => {
      if (pattern.includes('**/*.vue')) {
        const files = ['components/TestComponent.vue']
        return options?.absolute
          ? files.map(file => `${mockCwd}/${file}`)
          : files
      }
      return []
    })

    // Мокаем analyzeFiles для возврата большого файла
    vi.mocked(analyzeFiles).mockReturnValue({
      totalFiles: 1,
      totalSize: 2048,
      averageSize: 2048,
      largeFiles: [
        {
          path: `${mockTranslationDir}/en.json`,
          size: 2048,
          content: translationContent,
          keys: ['common.welcome', 'pages.home.title'],
        },
      ],
      deepNestingFiles: [],
      duplicateKeysFiles: [],
    })

    // Мокаем existsSync для проверки существования директорий
    vi.mocked(fs.existsSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      // Возвращаем false для поддиректорий, чтобы mkdirSync был вызван
      if (pathStr.endsWith('/en')) {
        return false
      }
      // Возвращаем true для основной директории и файлов
      return true
    })

    // Мокаем readFileSync для Vue файла
    vi.mocked(fs.readFileSync).mockImplementation((path: PathLike | number) => {
      if (typeof path === 'number') throw new TypeError('File descriptor not supported')
      const pathStr = String(path)
      const vueFilePath = `${mockCwd}/components/TestComponent.vue`
      const jsonFilePath = `${mockTranslationDir}/en.json`

      if (pathStr === vueFilePath) {
        return `
<template>
  <div>
    <h1>{{ $t('common.welcome') }}</h1>
    <p>{{ $t('pages.home.title') }}</p>
  </div>
</template>
        `
      }
      if (pathStr === jsonFilePath) {
        return JSON.stringify(translationContent)
      }
      if (pathStr.endsWith('.json')) {
        const fileName = pathStr.split('/').pop() || ''
        const key = fileName.replace('.json', '')
        return JSON.stringify(translationContent[key] || {})
      }
      return '{}'
    })

    // Очищаем моки перед запуском
    vi.clearAllMocks()

    // Запускаем команду
    if (command.run) await command.run(createCommandContext({ updatePaths: true }))

    // Проверяем, что файл был разделен
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      `${mockTranslationDir}/en`,
      { recursive: true },
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${mockTranslationDir}/en/common.json`,
      expect.stringContaining('"welcome": "Welcome"'),
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${mockTranslationDir}/en/pages.json`,
      expect.stringContaining('"title": "Home"'),
    )

    // Проверяем обновление Vue файла
    const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls
    const vueFilePath = `${mockCwd}/components/TestComponent.vue`
    const vueFileUpdates = writeFileCalls.filter(call =>
      String(call[0]) === vueFilePath,
    )

    expect(vueFileUpdates.length).toBeGreaterThan(0)
    const vueContent = String(vueFileUpdates[0][1])
    expect(vueContent).toContain('$t(\'common.welcome\')')
    expect(vueContent).toContain('$t(\'pages.home.title\')')
  })

  it('should handle errors when updating paths', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    // Мокаем все необходимые функции
    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      if (pathStr === mockTranslationDir) {
        return [
          { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        ]
      }
      return []
    })

    // Мокаем readFileSync для Vue файла, чтобы вызвать ошибку
    vi.mocked(fs.readFileSync).mockImplementation((path: PathLike | number) => {
      if (typeof path === 'number') throw new TypeError('File descriptor not supported')
      const pathStr = String(path)
      if (pathStr.includes('TestComponent.vue')) {
        throw new Error('Failed to read Vue file')
      }
      if (pathStr === `${mockTranslationDir}/en.json`) {
        return JSON.stringify({ common: { welcome: 'Welcome' } })
      }
      return '{}'
    })

    // Мокаем glob для поиска Vue файлов
    vi.mocked(glob.sync).mockReturnValue([`${mockCwd}/components/TestComponent.vue`])

    // Мокаем analyzeFiles для возврата большого файла
    vi.mocked(analyzeFiles).mockReturnValue({
      totalFiles: 1,
      totalSize: 2048,
      averageSize: 2048,
      largeFiles: [
        {
          path: `${mockTranslationDir}/en.json`,
          size: 2048,
          content: { common: { welcome: 'Welcome' } },
          keys: ['common.welcome'],
        },
      ],
      deepNestingFiles: [],
      duplicateKeysFiles: [],
    })

    // Мокаем подтверждение пользователя
    vi.mocked(consola.prompt).mockResolvedValue(true)

    // Очищаем моки перед запуском
    vi.clearAllMocks()

    // Запускаем команду и ожидаем ошибку
    if (command.run) {
      const promise = command.run(createCommandContext({ updatePaths: true }))
      await expect(promise).rejects.toThrow('Failed to read Vue file')
    }

    // Проверяем результат
    expect(consola.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Failed to update paths in .*TestComponent\.vue/),
      expect.any(Error),
    )
  })

  it('should not update paths in dry run mode', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ dryRun: true }))

    // Проверяем, что файлы не были обновлены
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining('.vue'),
      expect.any(String),
    )
  })

  it('should not update paths when updatePaths is disabled', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ updatePaths: false }))

    // Проверяем, что файлы не были обновлены
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining('.vue'),
      expect.any(String),
    )
  })

  it('should handle missing translation directory', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(fs.existsSync).mockReturnValueOnce(false)

    if (command.run) {
      await expect(command.run(createCommandContext({
        translationDir: '/non-existent',
      }))).rejects.toThrow('Translation directory does not exist')
    }
  })

  it('should cancel optimization when user declines confirmation', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    // Мокаем подтверждение пользователя
    vi.mocked(consola.prompt).mockResolvedValueOnce(false)

    // Мокаем glob для поиска Vue файлов
    vi.mocked(glob.sync).mockReturnValue([])

    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что оптимизация была отменена
    expect(consola.info).toHaveBeenCalledWith('Optimization cancelled')
    expect(fs.writeFileSync).not.toHaveBeenCalled()
    expect(fs.unlinkSync).not.toHaveBeenCalled()
  })

  it('should handle file processing errors gracefully', async () => {
    const command = optimizeCommand
    if (!command) throw new Error('Command not found')

    // Мокаем ошибку при чтении файла
    vi.mocked(fs.readFileSync).mockImplementationOnce(() => {
      throw new Error('Failed to read file')
    })

    // Мокаем analyzeFiles для возврата файлов, требующих оптимизации
    vi.mocked(analyzeFiles).mockReturnValue({
      totalFiles: 1,
      totalSize: 2048,
      averageSize: 2048,
      largeFiles: [
        {
          path: `${mockTranslationDir}/en.json`,
          size: 2048,
          content: { common: { welcome: 'Welcome' } },
          keys: ['common.welcome'],
        },
      ],
      deepNestingFiles: [],
      duplicateKeysFiles: [],
    })

    // Мокаем подтверждение пользователя
    vi.mocked(consola.prompt).mockResolvedValue(true)

    if (command.run) await command.run(createCommandContext({}))

    expect(consola.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to process'),
      expect.any(Error),
    )
    expect(consola.success).toHaveBeenCalledWith('Optimization completed')
  })
})
