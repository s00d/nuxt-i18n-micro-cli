import type { PathLike } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import textToI18nCommand from '../../src/commands/text-to-i18n'

// Мокаем модули
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockImplementation((path: PathLike) => {
      if (path.toString().includes('/non-existent')) return false
      return true
    }),
    statSync: vi.fn().mockImplementation((path: PathLike) => ({
      isDirectory: () => path.toString().includes('components') || path.toString().includes('pages'),
    })),
    readFileSync: vi.fn().mockImplementation((path: string) => {
      if (path.includes('invalid.json')) {
        return 'invalid json content'
      }
      if (path.includes('translations.json')) {
        return JSON.stringify({
          greeting: 'Hello',
          welcome: 'Welcome',
          nested: {
            message: 'Hello from nested',
            deep: {
              text: 'Hello from deep nested',
            },
          },
        })
      }
      if (path.includes('test.vue')) {
        return `<template>
          <div>
            <h1>Hello World</h1>
            <p>Welcome to our site</p>
            <div>This is a new text</div>
          </div>
        </template>`
      }
      if (path.includes('test.js')) {
        return `export default {
          data() {
            return {
              message: 'Hello from component'
            }
          }
        }`
      }
      return ''
    }),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn().mockImplementation((path: PathLike) => {
    if (path.toString().includes('/non-existent')) return false
    return true
  }),
  statSync: vi.fn().mockImplementation((path: PathLike) => ({
    isDirectory: () => path.toString().includes('components') || path.toString().includes('pages'),
  })),
  readFileSync: vi.fn().mockImplementation((path: string) => {
    if (path.includes('invalid.json')) {
      return 'invalid json content'
    }
    if (path.includes('translations.json')) {
      return JSON.stringify({
        greeting: 'Hello',
        welcome: 'Welcome',
        nested: {
          message: 'Hello from nested',
          deep: {
            text: 'Hello from deep nested',
          },
        },
      })
    }
    if (path.includes('test.vue')) {
      return `<template>
        <div>
          <h1>Hello World</h1>
          <p>Welcome to our site</p>
          <div>This is a new text</div>
        </div>
      </template>`
    }
    if (path.includes('test.js')) {
      return `export default {
        data() {
          return {
            message: 'Hello from component'
          }
        }
      }`
    }
    return ''
  }),
  writeFileSync: vi.fn(),
}))

vi.mock('glob', () => ({
  default: {
    sync: vi.fn().mockImplementation((pattern: string, _options: any) => {
      if (pattern.includes('components')) {
        return ['/test/components/test.vue']
      }
      if (pattern.includes('pages')) {
        return ['/test/pages/test.vue']
      }
      if (pattern.includes('plugins')) {
        return ['/test/plugins/test.js']
      }
      if (pattern.includes('layouts')) {
        return ['/test/layouts/test.vue']
      }
      return []
    }),
  },
  sync: vi.fn().mockImplementation((pattern: string, _options: any) => {
    if (pattern.includes('components')) {
      return ['/test/components/test.vue']
    }
    if (pattern.includes('pages')) {
      return ['/test/pages/test.vue']
    }
    if (pattern.includes('plugins')) {
      return ['/test/plugins/test.js']
    }
    if (pattern.includes('layouts')) {
      return ['/test/layouts/test.vue']
    }
    return []
  }),
}))

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn((path: string) => {
    if (path.includes('invalid.json')) {
      throw new Error('Invalid JSON')
    }
    return {
      greeting: 'Hello',
      welcome: 'Welcome',
      nested: {
        message: 'Hello from nested',
        deep: {
          text: 'Hello from deep nested',
        },
      },
    }
  }),
}))

vi.mock('../../src/utils/text_converner/file-processor', () => ({
  FileProcessor: vi.fn().mockImplementation(() => ({
    processFile: vi.fn().mockImplementation((file: string) => {
      if (file.includes('test.vue')) {
        return `<template>
          <div>
            <h1>{{ $t('greeting') }}</h1>
            <p>{{ $t('welcome') }}</p>
            <div>{{ $t('new.text') }}</div>
          </div>
        </template>`
      }
      if (file.includes('test.js')) {
        return `export default {
          data() {
            return {
              message: this.$t('component.message')
            }
          }
        }`
      }
      return ''
    }),
    getNewTranslations: vi.fn().mockReturnValue(new Map([
      ['new.text', { value: 'This is a new text', file: 'test.vue', line: 5 }],
      ['component.message', { value: 'Hello from component', file: 'test.js', line: 3 }],
    ])),
  })),
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

describe('text-to-i18n command', () => {
  const mockTranslationFile = '/test/translations.json'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createCommandContext = ({
    cwd = '/test',
    translationFile = mockTranslationFile,
    path,
    context,
    dryRun = false,
    verbose = false,
    logLevel = 'info',
  }: {
    cwd?: string
    translationFile?: string
    path?: string
    context?: string
    dryRun?: boolean
    verbose?: boolean
    logLevel?: string
  } = {}) => {
    const command = textToI18nCommand as any
    return {
      args: { cwd, translationFile, path, context, dryRun, verbose, logLevel },
      command,
    }
  }

  it('should process files and update translations', async () => {
    const command = textToI18nCommand as any
    if (command.run) await command.run(createCommandContext())

    // Проверяем, что были найдены файлы
    expect(vi.mocked(consola.info)).toHaveBeenCalledWith(expect.stringContaining('Found'))

    // Проверяем, что файлы были обработаны
    const fs = await import('node:fs')
    expect(fs.default.writeFileSync).toHaveBeenCalled()

    // Проверяем, что переводы были обновлены
    expect(vi.mocked(consola.info)).toHaveBeenCalledWith(expect.stringContaining('Found 2 new translations'))
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith('Updated translation file.')
  })

  it('should handle dry run mode', async () => {
    const command = textToI18nCommand as any
    if (command.run) await command.run(createCommandContext({ dryRun: true }))

    // Проверяем, что файлы не были изменены
    const fs = await import('node:fs')
    expect(fs.default.writeFileSync).not.toHaveBeenCalled()

    // Проверяем, что были показаны новые переводы
    expect(vi.mocked(consola.info)).toHaveBeenCalledWith('Dry run - no files were modified.')
    expect(vi.mocked(consola.info)).toHaveBeenCalledWith(expect.stringContaining('new.text'))
    expect(vi.mocked(consola.info)).toHaveBeenCalledWith(expect.stringContaining('component.message'))
  })

  it('should handle custom path', async () => {
    const command = textToI18nCommand as any
    if (command.run) await command.run(createCommandContext({
      path: '/test/components/test.vue',
    }))

    // Проверяем, что был обработан только указанный файл
    const glob = await import('glob')
    expect(glob.default.sync).toHaveBeenCalledWith('**/*.{vue,js,ts}', {
      absolute: true,
      cwd: '/test/components/test.vue',
    })
  })

  it('should handle non-existent path', async () => {
    const command = textToI18nCommand as any
    let error: Error | undefined

    try {
      if (command.run) await command.run(createCommandContext({
        path: '/non-existent',
      }))
    }
    catch (e) {
      error = e as Error
    }

    // Проверяем, что была выброшена ошибка
    expect(error).toBeDefined()
    expect(error?.message).toContain('Path does not exist')
  })

  it('should handle invalid translation file', async () => {
    const { loadJsonFile } = await import('../../src/utils/json')
    vi.mocked(loadJsonFile).mockImplementationOnce(() => {
      throw new Error('Invalid JSON')
    })

    const command = textToI18nCommand as any
    let error: Error | undefined

    try {
      if (command.run) await command.run(createCommandContext({
        translationFile: '/test/invalid.json',
      }))
    }
    catch (e) {
      error = e as Error
    }

    // Проверяем, что была выброшена ошибка
    expect(error).toBeDefined()
    expect(error?.message).toBe('Invalid JSON')

    // Проверяем, что writeJsonFile не вызывался
    const fs = await import('node:fs')
    expect(fs.default.writeFileSync).not.toHaveBeenCalled()
  })

  it('should handle context prefix for translation keys', async () => {
    const command = textToI18nCommand as any
    if (command.run) await command.run(createCommandContext({
      context: 'custom',
    }))

    // Проверяем, что FileProcessor был создан с правильным контекстом
    const { FileProcessor } = await import('../../src/utils/text_converner/file-processor')
    expect(FileProcessor).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        context: 'custom',
      }),
    )
  })

  it('should handle verbose mode', async () => {
    const command = textToI18nCommand as any
    if (command.run) await command.run(createCommandContext({
      verbose: true,
    }))

    // Проверяем, что были показаны подробные сообщения
    expect(vi.mocked(consola.info)).toHaveBeenCalledWith(expect.stringContaining('Processing'))
    expect(vi.mocked(consola.success)).toHaveBeenCalledWith(expect.stringContaining('Processed'))
  })
})
