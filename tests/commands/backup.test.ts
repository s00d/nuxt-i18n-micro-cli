import { beforeEach, describe, expect, it, vi } from 'vitest'
import backupCommand from '../../src/commands/backup'
import { createProjectBackup } from '../../src/core/services/BackupRestoreService'
import { resolveCommandContext } from '../../src/commands/_shared'

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

vi.mock('../../src/core/services/BackupRestoreService', () => ({
  createProjectBackup: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveCommandContext: vi.fn(),
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
    vi.mocked(resolveCommandContext).mockResolvedValue({
      cwd: mockCwd,
      translationDir: mockTranslationDir,
      config: { locales: mockLocales, defaultLocale: 'en' },
    } as never)
    vi.mocked(createProjectBackup).mockResolvedValue('/tmp/archive.zip')
  })

  it('should create backup archive', async () => {
    const command = backupCommand
    if (!command) throw new Error('Command not found')

    if (command.run) await command.run(createCommandContext({}))

    expect(createProjectBackup).toHaveBeenCalledWith({
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

    expect(createProjectBackup).toHaveBeenCalledWith({
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

    expect(createProjectBackup).toHaveBeenCalledWith({
      translationDir: mockTranslationDir,
      backupDir: mockBackupDir,
      password,
      comment: '',
    })
  })

  it('should handle missing translation directory', async () => {
    const command = backupCommand
    if (!command) throw new Error('Command not found')

    vi.mocked(createProjectBackup).mockRejectedValueOnce(new Error('Translation directory does not exist'))

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
    vi.mocked(createProjectBackup).mockRejectedValueOnce(error)

    if (command.run) {
      await expect(command.run(createCommandContext({}))).rejects.toThrow(error)
    }
  })
})
