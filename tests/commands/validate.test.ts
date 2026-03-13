import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import validateCommand from '../../src/commands/validate'
import { validateProjectLocales } from '../../src/core/services/ValidationService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    warn: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/ValidationService', () => ({
  validateProjectLocales: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('validate command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: {} as never,
    })
  })

  it('reports success when there are no issues', async () => {
    vi.mocked(validateProjectLocales).mockReturnValue([])
    if (validateCommand.run) {
      await validateCommand.run({ args: {} } as never)
    }
    expect(consola.success).toHaveBeenCalledWith('All translation files are valid.')
  })

  it('throws when validation issues are present', async () => {
    vi.mocked(validateProjectLocales).mockReturnValue([{
      locale: 'ru',
      missingKeys: ['welcome'],
      extraKeys: [],
    }] as never)
    if (validateCommand.run) {
      await expect(validateCommand.run({ args: {} } as never)).rejects.toThrow('Validation failed with errors.')
    }
    expect(consola.warn).toHaveBeenCalledWith(expect.stringContaining('Locale ru is missing keys'))
  })
})
