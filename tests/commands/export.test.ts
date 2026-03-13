import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consola } from 'consola'
import exportCommand from '../../src/commands/export'
import { exportProjectToPo } from '../../src/core/services/PoService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../src/core/services/PoService', () => ({
  exportProjectToPo: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('export command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: {} as never,
    })
  })

  it('exports project translations to default pots directory', async () => {
    if (exportCommand.run) {
      await exportCommand.run({
        args: {
          cwd: '/test/project',
          translationDir: 'locales',
          potsDir: undefined,
          logLevel: 'info',
        },
      } as never)
    }

    expect(exportProjectToPo).toHaveBeenCalledWith(expect.anything(), '/test/project/pots')
    expect(consola.success).toHaveBeenCalledWith('Translations were exported to PO files.')
  })

  it('uses custom pots directory when provided', async () => {
    if (exportCommand.run) {
      await exportCommand.run({
        args: {
          cwd: '/test/project',
          translationDir: 'locales',
          potsDir: 'custom-pots',
          logLevel: 'info',
        },
      } as never)
    }

    expect(exportProjectToPo).toHaveBeenCalledWith(expect.anything(), '/test/project/custom-pots')
  })

  it('propagates service errors', async () => {
    vi.mocked(exportProjectToPo).mockRejectedValueOnce(new Error('po export failed'))

    if (exportCommand.run) {
      await expect(exportCommand.run({
        args: {
          cwd: '/test/project',
          translationDir: 'locales',
          potsDir: 'pots',
          logLevel: 'info',
        },
      } as never)).rejects.toThrow('po export failed')
    }
  })
})
