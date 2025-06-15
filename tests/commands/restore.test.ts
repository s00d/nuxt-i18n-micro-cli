import type { Dirent, Stats, PathLike } from 'node:fs'
import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import restoreCommand from '../../src/commands/restore'
import { getI18nConfig } from '../../src/utils/kit'
import { extractBackupArchive, getBackupList, cleanupExtractedBackup } from '../../src/utils/backup'

vi.mock('../../src/utils/kit')
vi.mock('../../src/utils/backup')
vi.mock('process', () => ({
  exit: vi.fn(),
}))

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    cpSync: vi.fn(),
    copyFileSync: vi.fn(),
    statSync: vi.fn(),
    rmSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  cpSync: vi.fn(),
  copyFileSync: vi.fn(),
  statSync: vi.fn(),
  rmSync: vi.fn(),
}))

vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    resolve: (...args: string[]) => args.join('/'),
    basename: (path: string) => path.split('/').pop() || '',
    dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
    parse: (path: string) => ({
      name: path.split('/').pop()?.replace('.zip', '') || '',
      ext: '.zip',
    }),
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
}))

vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    prompt: vi.fn().mockResolvedValue(true),
  },
}))

describe('restore command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir = 'locales'
  const mockBackupDir = 'locales/backups'
  const mockBackupName = '2024-03-20T12-00-00'
  const mockExtractPath = `${mockBackupDir}/${mockBackupName}`
  const mockLocales = [
    { code: 'en' },
    { code: 'ru' },
    { code: 'de' },
  ]

  const createCommandContext = (args: {
    cwd?: string
    translationDir?: string
    backupDir?: string
    backup?: string
    password?: string
    force?: boolean
    logLevel?: string
  }) => ({
    args: {
      _: [],
      cwd: mockCwd,
      translationDir: mockTranslationDir,
      backupDir: mockBackupDir,
      backup: mockBackupName,
      password: '',
      force: false,
      logLevel: 'info',
      ...args,
    },
    rawArgs: [],
    cmd: restoreCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === mockTranslationDir) return true
        if (path === mockBackupDir) return true
        if (path === mockExtractPath) return true
        if (path.endsWith('.json')) return true
      }
      return false
    })

    // Создаем моки для Dirent с учетом структуры директорий
    const mockDirents: Record<string, Dirent[]> = {
      [mockExtractPath]: [
        { name: 'en.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'ru.json', isDirectory: () => false, isFile: () => true } as Dirent,
        { name: 'pages', isDirectory: () => true, isFile: () => false } as Dirent,
      ],
      [`${mockExtractPath}/pages`]: [
        { name: 'about.json', isDirectory: () => false, isFile: () => true } as Dirent,
      ],
    }

    vi.mocked(fs.readdirSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      return mockDirents[pathStr] || []
    })

    // Создаем мок для Stats
    const mockStats = {
      isDirectory: () => false,
      isFile: () => false,
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      size: 0,
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

    vi.mocked(fs.statSync).mockImplementation((path: PathLike) => {
      const pathStr = String(path)
      return {
        ...mockStats,
        isDirectory: () => pathStr === mockExtractPath || pathStr.includes('/pages'),
        isFile: () => pathStr.endsWith('.json'),
      } as Stats
    })

    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: mockLocales,
      translationDir: mockTranslationDir,
      defaultLocale: 'en',
    })
    vi.mocked(getBackupList).mockReturnValue([`${mockBackupName}.zip`])
    vi.mocked(extractBackupArchive).mockResolvedValue(mockExtractPath)
    vi.mocked(cleanupExtractedBackup).mockImplementation(() => {})
  })

  it('should show available backups when no backup specified', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ backup: undefined }))

    expect(getBackupList).toHaveBeenCalledWith(mockBackupDir)
    expect(consola.info).toHaveBeenCalledWith('Available backups:')
    expect(consola.info).toHaveBeenCalledWith('1. 2024-03-20T12-00-00.zip')
  })

  it('should restore from backup', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({}))

    expect(extractBackupArchive).toHaveBeenCalledWith({
      translationDir: mockTranslationDir,
      backupDir: mockBackupDir,
      backup: mockBackupName,
      password: '',
    })
    expect(consola.success).toHaveBeenCalledWith(
      `Restored 3 files from backup "${mockBackupName}"`,
    )
    expect(cleanupExtractedBackup).toHaveBeenCalledWith(mockExtractPath)
  })

  it('should restore from backup with password', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    const password = 'secret123'
    if (command.run) await command.run(createCommandContext({ password }))

    expect(extractBackupArchive).toHaveBeenCalledWith({
      translationDir: mockTranslationDir,
      backupDir: mockBackupDir,
      backup: mockBackupName,
      password,
    })
  })

  it('should restore from backup without confirmation when force flag is set', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({ force: true }))

    expect(consola.prompt).not.toHaveBeenCalled()
  })

  it('should cancel restore when user declines confirmation', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(consola.prompt).mockResolvedValueOnce(false)

    if (command.run) await command.run(createCommandContext({}))

    expect(extractBackupArchive).not.toHaveBeenCalled()
    expect(consola.info).toHaveBeenCalledWith('Restore cancelled')
  })

  it('should handle missing backup directory', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(fs.existsSync).mockReturnValueOnce(false)

    if (command.run) {
      await expect(command.run(createCommandContext({
        backupDir: '/non-existent',
      }))).rejects.toThrow('Backup directory does not exist')
    }
  })

  it('should handle backup extraction error', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    const error = new Error('Failed to extract backup')
    vi.mocked(extractBackupArchive).mockRejectedValueOnce(error)

    if (command.run) {
      await expect(command.run(createCommandContext({}))).rejects.toThrow(error)
      expect(consola.error).toHaveBeenCalledWith('Failed to restore backup:', error)
      expect(cleanupExtractedBackup).not.toHaveBeenCalled()
    }
  })

  it('should handle missing backup file', async () => {
    const command = restoreCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(getBackupList).mockReturnValue([])

    if (command.run) {
      await expect(command.run(createCommandContext({ backup: undefined }))).rejects.toThrow('No backups found')
    }
  })
})
