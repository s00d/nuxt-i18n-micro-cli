import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import replaceValuesCommand from '../../src/commands/replace-values'
import { replaceProjectValues } from '../../src/core/services/ReplaceValuesService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/ReplaceValuesService', () => ({
  replaceProjectValues: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('replace-values command', () => {
  const project = { save: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: project as never,
    })
    vi.mocked(replaceProjectValues).mockReturnValue(3)
  })

  it('replaces values and saves project', async () => {
    if (replaceValuesCommand.run) {
      await replaceValuesCommand.run({
        args: { search: 'old', replace: 'new', useRegex: false },
      } as never)
    }

    expect(replaceProjectValues).toHaveBeenCalledWith(project, {
      search: 'old',
      replace: 'new',
      useRegex: false,
    })
    expect(project.save).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('Translation values have been updated. Changed keys: 3')
  })
})
