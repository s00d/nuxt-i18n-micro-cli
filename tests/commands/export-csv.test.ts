import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consola } from 'consola'
import exportCsvCommand from '../../src/commands/export-csv'
import { exportProjectToCsv } from '../../src/core/services/CsvService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/CsvService', () => ({
  exportProjectToCsv: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('export-csv command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: {} as never,
    })
  })

  it('exports CSV to default directory', async () => {
    if (exportCsvCommand.run) {
      await exportCsvCommand.run({
        args: {
          csvDir: undefined,
          cwd: '/test/project',
          translationDir: 'locales',
          logLevel: 'info',
        },
      } as never)
    }

    expect(exportProjectToCsv).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('csv_exports'))
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('Exported translations to'))
  })

  it('exports CSV to custom directory', async () => {
    if (exportCsvCommand.run) {
      await exportCsvCommand.run({
        args: {
          csvDir: 'custom-csv',
          cwd: '/test/project',
          translationDir: 'locales',
          logLevel: 'info',
        },
      } as never)
    }

    expect(exportProjectToCsv).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('custom-csv'))
  })

  it('propagates export errors', async () => {
    vi.mocked(exportProjectToCsv).mockRejectedValueOnce(new Error('csv export failed'))

    if (exportCsvCommand.run) {
      await expect(exportCsvCommand.run({
        args: {
          csvDir: 'csv_exports',
          cwd: '/test/project',
          translationDir: 'locales',
          logLevel: 'info',
        },
      } as never)).rejects.toThrow('csv export failed')
    }
  })
})
