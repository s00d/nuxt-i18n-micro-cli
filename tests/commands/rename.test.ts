import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import renameCommand from '../../src/commands/rename'
import { renameProjectKey } from '../../src/core/services/RenameService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../../src/core/services/RenameService', () => ({
  renameProjectKey: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('rename command', () => {
  const project = { save: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: project as never,
    })
    vi.mocked(renameProjectKey).mockReturnValue({
      localesUpdated: 2,
      localeReferencesUpdated: 3,
      sourceFilesUpdated: 1,
      sourceReplacements: 2,
    })
  })

  it('renames key and saves project', async () => {
    if (renameCommand.run) {
      await renameCommand.run({
        args: { from: 'home.title', to: 'home.hero.title', dryRun: false },
      } as never)
    }

    expect(renameProjectKey).toHaveBeenCalledWith(project, expect.objectContaining({
      from: 'home.title',
      to: 'home.hero.title',
      dryRun: false,
    }))
    expect(project.save).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('Key renamed: home.title -> home.hero.title'))
  })

  it('does not save project in dry-run mode', async () => {
    if (renameCommand.run) {
      await renameCommand.run({
        args: { from: 'home.title', to: 'home.hero.title', dryRun: true },
      } as never)
    }

    expect(project.save).not.toHaveBeenCalled()
    expect(consola.info).toHaveBeenCalledWith(expect.stringContaining('Dry run'))
  })
})
