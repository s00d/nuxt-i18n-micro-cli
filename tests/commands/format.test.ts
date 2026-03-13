import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import formatCommand from '../../src/commands/format'
import { sortProjectTranslations } from '../../src/core/services/FormatService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/FormatService', () => ({
  sortProjectTranslations: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('format command', () => {
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

  it('sorts and saves when sortKeys is enabled', async () => {
    if (formatCommand.run) {
      await formatCommand.run({ args: { sortKeys: true } } as never)
    }

    expect(sortProjectTranslations).toHaveBeenCalledWith(project)
    expect(project.save).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('Translation files have been formatted.')
  })

  it('does not sort or save when sortKeys is disabled', async () => {
    if (formatCommand.run) {
      await formatCommand.run({ args: { sortKeys: false } } as never)
    }

    expect(sortProjectTranslations).not.toHaveBeenCalled()
    expect(project.save).not.toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('Translation files have been formatted.')
  })
})
