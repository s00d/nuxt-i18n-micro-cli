import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import syncRemoteCommand from '../../src/commands/sync-remote'
import { resolveProjectContext } from '../../src/commands/_shared'
import { runRemoteSync } from '../../src/core/services/RemoteSyncService'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

vi.mock('../../src/core/services/RemoteSyncService', () => ({
  runRemoteSync: vi.fn(),
}))

describe('sync-remote command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: { locales: [{ code: 'en' }, { code: 'ru' }] },
      project: {} as never,
    } as never)
  })

  it('prints dry-run message when dry run enabled', async () => {
    vi.mocked(runRemoteSync).mockResolvedValue({
      dryRun: true,
      added: [],
      updated: [],
      deleted: [],
      conflicts: [],
      errors: [],
    } as never)
    if (syncRemoteCommand.run) {
      await syncRemoteCommand.run({ args: { dryRun: true, pull: true, push: false, force: false } } as never)
    }
    expect(consola.info).toHaveBeenCalledWith('Dry run completed. No changes were made.')
  })

  it('prints result summary for applied sync', async () => {
    vi.mocked(runRemoteSync).mockResolvedValue({
      dryRun: false,
      added: ['de'],
      updated: ['en'],
      deleted: [],
      conflicts: [],
      errors: [],
    } as never)
    if (syncRemoteCommand.run) {
      await syncRemoteCommand.run({ args: { dryRun: false, pull: true, push: true, force: false } } as never)
    }
    expect(consola.success).toHaveBeenCalledWith('Added 1 new locales: de')
    expect(consola.success).toHaveBeenCalledWith('Updated 1 locales: en')
  })
})
