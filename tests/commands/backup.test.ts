import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import backupCommand from '../../src/commands/backup'
import { getI18nConfig } from '../../src/utils/kit'
import { createBackupArchive } from '../../src/utils/backup'

vi.mock('../../src/utils/kit')
vi.mock('../../src/utils/backup')
vi.mock('process', () => ({
  exit: vi.fn(),
}))

vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}))

describe('backup command', () => {
  const mockCwd = '/test/project'
  const mockTranslationDir = 'locales'
  const mockBackupDir = 'locales/backups'
  const mockLocales = [
    { code: 'en' },
    { code: 'ru' },
    { code: 'de' },
  ]

  const createCommandContext = (args: {
    cwd?: string
    translationDir?: string
    backupDir?: string
    password?: string
    comment?: string
    logLevel?: string
  }) => ({
    args: {
      _: [],
      cwd: args.cwd || mockCwd,
      translationDir: args.translationDir || mockTranslationDir,
      backupDir: args.backupDir || mockBackupDir,
      password: args.password || '',
      comment: args.comment || '',
      logLevel: args.logLevel || 'info',
    },
    rawArgs: [],
    cmd: backupCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        if (path === mockTranslationDir) return true
        if (path === mockBackupDir) return true
      }
      return false
    })

    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: mockLocales,
      translationDir: mockTranslationDir,
      defaultLocale: 'en',
    })
  })

  it('should create backup archive', async () => {
    const command = backupCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({}))

    expect(createBackupArchive).toHaveBeenCalledWith({
      translationDir: mockTranslationDir,
      backupDir: mockBackupDir,
      password: '',
      comment: '',
    })
  })

  it('should create backup with comment', async () => {
    const command = backupCommand
    if (!command) throw new Error('Command not found')

    const comment = 'test-backup'
    if (command.run) await command.run(createCommandContext({ comment }))

    expect(createBackupArchive).toHaveBeenCalledWith({
      translationDir: mockTranslationDir,
      backupDir: mockBackupDir,
      password: '',
      comment,
    })
  })

  it('should create encrypted backup with password', async () => {
    const command = backupCommand
    if (!command) throw new Error('Command not found')

    const password = 'secret123'
    if (command.run) await command.run(createCommandContext({ password }))

    expect(createBackupArchive).toHaveBeenCalledWith({
      translationDir: mockTranslationDir,
      backupDir: mockBackupDir,
      password,
      comment: '',
    })
  })

  it('should handle missing translation directory', async () => {
    const command = backupCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(fs.existsSync).mockReturnValueOnce(false)

    if (command.run) {
      await expect(command.run(createCommandContext({
        translationDir: '/non-existent',
      }))).rejects.toThrow('Translation directory does not exist')
    }
  })

  it('should handle backup creation error', async () => {
    const command = backupCommand
    if (!command) throw new Error('Command not found')

    const error = new Error('Failed to create backup')
    vi.mocked(createBackupArchive).mockRejectedValueOnce(error)

    if (command.run) {
      await expect(command.run(createCommandContext({}))).rejects.toThrow(error)
      expect(consola.error).toHaveBeenCalledWith('Failed to create backup:', error)
    }
  })
})
