import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import syncCommand from '../../src/commands/sync'
import { synchronizeProjectLocales } from '../../src/core/services/SyncService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/SyncService', () => ({
  synchronizeProjectLocales: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('sync command', () => {
  const project = { save: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: project as never,
    })
  })

  it('synchronizes and saves project', async () => {
    if (syncCommand.run) {
      await syncCommand.run({ args: {} } as never)
    }

    expect(synchronizeProjectLocales).toHaveBeenCalledWith(project)
    expect(project.save).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('Translations have been synchronized.')
  })
})
