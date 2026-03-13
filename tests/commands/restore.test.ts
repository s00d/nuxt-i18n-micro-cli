import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import restoreCommand from '../../src/commands/restore'
import { listProjectBackups, restoreProjectFromBackup } from '../../src/core/services/BackupRestoreService'
import { resolveCommandContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    prompt: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('../../src/core/services/BackupRestoreService', () => ({
  listProjectBackups: vi.fn(),
  restoreProjectFromBackup: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveCommandContext: vi.fn(),
}))

describe('restore command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveCommandContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
    })
    vi.mocked(listProjectBackups).mockReturnValue(['backup-1', 'backup-2'])
  })

  it('prints list when backup is not provided', async () => {
    if (restoreCommand.run) {
      await restoreCommand.run({ args: { backup: undefined, force: true } } as never)
    }
    expect(consola.info).toHaveBeenCalledWith('Available backups:')
  })

  it('restores selected backup', async () => {
    vi.mocked(restoreProjectFromBackup).mockResolvedValue(['en.json', 'ru.json'])
    if (restoreCommand.run) {
      await restoreCommand.run({ args: { backup: 'backup-1', force: true } } as never)
    }
    expect(restoreProjectFromBackup).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('Restored 2 files from backup "backup-1"')
  })
})
