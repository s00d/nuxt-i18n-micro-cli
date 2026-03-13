import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import pseudoCommand from '../../src/commands/pseudo'
import { generatePseudoLocale } from '../../src/core/services/PseudoService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../../src/core/services/PseudoService', () => ({
  generatePseudoLocale: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('pseudo command', () => {
  const project = { save: vi.fn(), config: { defaultLocale: 'en' } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: { defaultLocale: 'en' } as never,
      project: project as never,
    })
    vi.mocked(generatePseudoLocale).mockReturnValue({
      updatedKeys: 3,
      skippedKeys: 1,
      sourceLocale: 'en',
      targetLocale: 'en-xa',
    })
  })

  it('generates pseudo locale and saves project', async () => {
    if (pseudoCommand.run) {
      await pseudoCommand.run({
        args: { targetLocale: 'en-xa', sourceLocale: 'en', replace: true },
      } as never)
    }

    expect(generatePseudoLocale).toHaveBeenCalledWith(project, expect.objectContaining({
      sourceLocale: 'en',
      targetLocale: 'en-xa',
      replace: true,
    }))
    expect(project.save).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('Pseudo locale generated'))
  })

  it('uses project default locale when sourceLocale is omitted', async () => {
    if (pseudoCommand.run) {
      await pseudoCommand.run({
        args: { targetLocale: 'en-xa', replace: false },
      } as never)
    }

    expect(generatePseudoLocale).toHaveBeenCalledWith(project, expect.objectContaining({
      sourceLocale: 'en',
      targetLocale: 'en-xa',
    }))
  })
})
