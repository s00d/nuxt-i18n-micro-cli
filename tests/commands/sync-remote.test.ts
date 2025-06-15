import type * as fsType from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import type axios from 'axios'
import type { Mock } from 'vitest'
import syncRemoteCommand from '../../src/commands/sync-remote'

// Мокаем модули
vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn().mockReturnValue({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
      head: vi.fn(),
      options: vi.fn(),
      getUri: vi.fn(),
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: vi.fn(),
          eject: vi.fn(),
          clear: vi.fn(),
        },
        response: {
          use: vi.fn(),
          eject: vi.fn(),
          clear: vi.fn(),
        },
      },
    }),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
  isAxiosError: vi.fn().mockReturnValue(false),
}))

vi.mock('../../src/utils/kit', () => ({
  getI18nConfig: vi.fn().mockResolvedValue({
    locales: ['en', 'ru'],
    defaultLocale: 'en',
    translationDir: '/test/cwd/translations',
  }),
}))

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn(),
  saveJsonFile: vi.fn(),
  flattenTranslations: vi.fn(),
}))

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    readdirSync: vi.fn().mockReturnValue(['en.json', 'ru.json']),
    mkdirSync: vi.fn(),
    statSync: vi.fn().mockImplementation((_path: string) => ({
      isFile: () => true,
      isDirectory: () => false,
      size: 1024,
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      birthtime: new Date(),
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
    })),
    copyFileSync: vi.fn(),
    rmSync: vi.fn(),
    renameSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn().mockReturnValue(['en.json', 'ru.json']),
  mkdirSync: vi.fn(),
  statSync: vi.fn().mockImplementation((_path: string) => ({
    isFile: () => true,
    isDirectory: () => false,
    size: 1024,
    atime: new Date(),
    mtime: new Date(),
    ctime: new Date(),
    birthtime: new Date(),
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
  })),
  copyFileSync: vi.fn(),
  rmSync: vi.fn(),
  renameSync: vi.fn(),
}))

// Константы для тестов
const mockCwd = '/test/cwd'
const mockTranslationDir = path.join(mockCwd, 'translations')

const createCommandContext = (args: {
  cwd?: string
  translationDir?: string
  pull?: boolean
  push?: boolean
  force?: boolean
  dryRun?: boolean
  backup?: boolean
  logLevel?: string
} = {}) => ({
  args: {
    _: [],
    cwd: mockCwd,
    translationDir: mockTranslationDir,
    pull: true,
    push: false,
    force: false,
    dryRun: false,
    backup: true,
    logLevel: 'info',
    ...args,
  },
  rawArgs: [],
  cmd: syncRemoteCommand,
})

describe('sync-remote command', () => {
  let fs: typeof fsType
  let mockAxiosInstance: ReturnType<typeof axios.create>
  let getI18nConfig: any
  let loadJsonFile: Mock
  let flattenTranslations: Mock

  beforeEach(async () => {
    vi.clearAllMocks()

    // Получаем моки
    fs = (await import('node:fs')).default
    mockAxiosInstance = (await import('axios')).default.create()
    const jsonUtils = await import('../../src/utils/json')
    const { getI18nConfig: getI18nConfigFn } = await import('../../src/utils/kit')

    loadJsonFile = jsonUtils.loadJsonFile as Mock
    flattenTranslations = jsonUtils.flattenTranslations as Mock
    getI18nConfig = getI18nConfigFn

    // Мокаем конфигурацию i18n
    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: [
        { code: 'en', name: 'English' },
        { code: 'ru', name: 'Русский' },
      ],
      defaultLocale: 'en',
      translationDir: mockTranslationDir,
    })

    // Мокаем flattenTranslations
    vi.mocked(flattenTranslations).mockImplementation((translations: Record<string, any>) => {
      if (!translations) return {}
      const result: Record<string, any> = {}
      for (const [locale, content] of Object.entries(translations)) {
        if (typeof content === 'object' && content !== null) {
          for (const [key, value] of Object.entries(content)) {
            result[`${locale}.${key}`] = value
          }
        }
      }
      return result
    })

    // Мокаем loadJsonFile
    vi.mocked(loadJsonFile).mockImplementation((path: string) => {
      if (path.endsWith('en.json')) {
        return { hello: 'Hello' }
      }
      if (path.endsWith('ru.json')) {
        return { hello: 'Привет' }
      }
      return {}
    })

    // Мокаем конфигурацию i18n
    vi.mocked(fs.existsSync).mockImplementation((path: fsType.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr.endsWith('.i18n-remote.json')) return false
      return true
    })
  })

  it('should validate remote configuration', async () => {
    const command = syncRemoteCommand
    let error: Error | undefined

    try {
      await command.run?.(createCommandContext())
    }
    catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
    expect(error?.message).toBe('Remote configuration file not found. Please run setup-remote first.')
  })

  it('should handle GitHub token requirement', async () => {
    // Мокаем конфигурацию без токена
    vi.mocked(fs.existsSync).mockImplementation((path: fsType.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr.endsWith('.i18n-remote.json')) return true
      return true
    })
    vi.mocked(fs.readFileSync).mockImplementation((path: fsType.PathOrFileDescriptor) => {
      const pathStr = path.toString()
      if (pathStr.endsWith('.i18n-remote.json')) {
        return JSON.stringify({
          type: 'github',
          url: 'https://github.com/owner/repo',
          branch: 'main',
          path: 'translations',
        })
      }
      return '{}'
    })

    const command = syncRemoteCommand
    let error: Error | undefined

    try {
      await command.run?.(createCommandContext())
    }
    catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
    expect(error?.message).toBe('github token is required')
  })

  it('should handle custom remote auth requirement', async () => {
    // Мокаем конфигурацию без учетных данных
    vi.mocked(fs.existsSync).mockImplementation((path: fsType.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr.endsWith('.i18n-remote.json')) return true
      return true
    })
    vi.mocked(fs.readFileSync).mockImplementation((path: fsType.PathOrFileDescriptor) => {
      const pathStr = path.toString()
      if (pathStr.endsWith('.i18n-remote.json')) {
        return JSON.stringify({
          type: 'custom',
          url: 'https://api.example.com',
          branch: 'main',
          path: 'translations',
        })
      }
      return '{}'
    })

    const command = syncRemoteCommand
    let error: Error | undefined

    try {
      await command.run?.(createCommandContext())
    }
    catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
    expect(error?.message).toBe('Custom remote requires username and password')
  })

  it('should handle invalid remote URL', async () => {
    // Мокаем конфигурацию с невалидным URL
    vi.mocked(fs.existsSync).mockImplementation((path: fsType.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr.endsWith('.i18n-remote.json')) return true
      return true
    })
    vi.mocked(fs.readFileSync).mockImplementation((path: fsType.PathOrFileDescriptor) => {
      const pathStr = path.toString()
      if (pathStr.endsWith('.i18n-remote.json')) {
        return JSON.stringify({
          type: 'github',
          url: 'invalid-url',
          branch: 'main',
          path: 'translations',
          token: 'test-token',
        })
      }
      return '{}'
    })

    const command = syncRemoteCommand
    let error: Error | undefined

    try {
      await command.run?.(createCommandContext())
    }
    catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
    expect(error?.message).toBe('Invalid remote URL')
  })

  it('should create axios instance with correct configuration for GitHub', async () => {
    // Мокаем валидную конфигурацию GitHub
    vi.mocked(fs.existsSync).mockImplementation((path: fsType.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr.endsWith('.i18n-remote.json')) return true
      return true
    })
    vi.mocked(fs.readFileSync).mockImplementation((path: fsType.PathOrFileDescriptor) => {
      const pathStr = path.toString()
      if (pathStr.endsWith('.i18n-remote.json')) {
        return JSON.stringify({
          type: 'github',
          url: 'https://github.com/owner/repo',
          branch: 'main',
          path: 'translations',
          token: 'test-token',
        })
      }
      return '{}'
    })

    // Мокаем успешный ответ от GitHub API
    vi.mocked(mockAxiosInstance.get).mockImplementation((url: string) => {
      if (url.includes('/contents/')) {
        return Promise.resolve({
          data: [
            {
              name: 'en.json',
              path: 'translations/en.json',
              type: 'file',
              download_url: 'https://api.github.com/repos/owner/repo/contents/translations/en.json',
            },
            {
              name: 'ru.json',
              path: 'translations/ru.json',
              type: 'file',
              download_url: 'https://api.github.com/repos/owner/repo/contents/translations/ru.json',
            },
          ],
        })
      }
      if (url.includes('en.json')) {
        return Promise.resolve({ data: { hello: 'Hello World' } })
      }
      if (url.includes('ru.json')) {
        return Promise.resolve({ data: { hello: 'Привет Мир' } })
      }
      return Promise.resolve({ data: [] })
    })

    const command = syncRemoteCommand
    await command.run?.(createCommandContext())

    expect(mockAxiosInstance.defaults.headers.common['Accept']).toBe('application/vnd.github.v3+json')
    expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('token test-token')
  })

  it('should handle dry run mode', async () => {
    // Мокаем валидную конфигурацию GitHub
    vi.mocked(fs.existsSync).mockImplementation((path: fsType.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr.endsWith('.i18n-remote.json')) return true
      return true
    })
    vi.mocked(fs.readFileSync).mockImplementation((path: fsType.PathOrFileDescriptor) => {
      const pathStr = path.toString()
      if (pathStr.endsWith('.i18n-remote.json')) {
        return JSON.stringify({
          type: 'github',
          url: 'https://github.com/owner/repo',
          branch: 'main',
          path: 'translations',
          token: 'test-token',
        })
      }
      return '{}'
    })

    // Мокаем успешный ответ от GitHub API
    vi.mocked(mockAxiosInstance.get).mockImplementation((url: string) => {
      if (url.includes('/contents/')) {
        return Promise.resolve({
          data: [
            {
              name: 'en.json',
              path: 'translations/en.json',
              type: 'file',
              download_url: 'https://api.github.com/repos/owner/repo/contents/translations/en.json',
            },
            {
              name: 'ru.json',
              path: 'translations/ru.json',
              type: 'file',
              download_url: 'https://api.github.com/repos/owner/repo/contents/translations/ru.json',
            },
          ],
        })
      }
      if (url.includes('en.json')) {
        return Promise.resolve({ data: { hello: 'Hello World' } })
      }
      if (url.includes('ru.json')) {
        return Promise.resolve({ data: { hello: 'Привет Мир' } })
      }
      return Promise.resolve({ data: [] })
    })

    const command = syncRemoteCommand
    await command.run?.(createCommandContext({ dryRun: true }))

    // Проверяем, что файлы не были записаны
    expect(fs.writeFileSync).not.toHaveBeenCalled()
    expect(consola.info).toHaveBeenCalledWith('Dry run completed. No changes were made.')
  })

  it('should create backup when requested', async () => {
    // Мокаем валидную конфигурацию GitHub
    vi.mocked(fs.existsSync).mockImplementation((path: fsType.PathLike) => {
      const pathStr = path.toString()
      if (pathStr === mockTranslationDir) return true
      if (pathStr.endsWith('.i18n-remote.json')) return true
      return true
    })
    vi.mocked(fs.readFileSync).mockImplementation((path: fsType.PathOrFileDescriptor) => {
      const pathStr = path.toString()
      if (pathStr.endsWith('.i18n-remote.json')) {
        return JSON.stringify({
          type: 'github',
          url: 'https://github.com/owner/repo',
          branch: 'main',
          path: 'translations',
          token: 'test-token',
        })
      }
      if (pathStr.endsWith('en.json')) {
        return JSON.stringify({ hello: 'Hello' })
      }
      if (pathStr.endsWith('ru.json')) {
        return JSON.stringify({ hello: 'Привет' })
      }
      return '{}'
    })

    // Мокаем успешный ответ от GitHub API
    vi.mocked(mockAxiosInstance.get).mockImplementation((url: string) => {
      if (url.includes('/contents/')) {
        return Promise.resolve({
          data: [
            {
              name: 'en.json',
              path: 'translations/en.json',
              type: 'file',
              download_url: 'https://api.github.com/repos/owner/repo/contents/translations/en.json',
            },
            {
              name: 'ru.json',
              path: 'translations/ru.json',
              type: 'file',
              download_url: 'https://api.github.com/repos/owner/repo/contents/translations/ru.json',
            },
          ],
        })
      }
      if (url.includes('en.json')) {
        return Promise.resolve({ data: { hello: 'Hello World' } })
      }
      if (url.includes('ru.json')) {
        return Promise.resolve({ data: { hello: 'Привет Мир' } })
      }
      return Promise.resolve({ data: [] })
    })

    const command = syncRemoteCommand
    await command.run?.(createCommandContext({ backup: true }))

    // Проверяем, что была создана резервная копия
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('backup'), { recursive: true })
    expect(fs.copyFileSync).toHaveBeenCalled()
  })
})
