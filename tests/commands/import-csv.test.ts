import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import importCsvCommand from '../../src/commands/import-csv'
import { importProjectFromCsv } from '../../src/core/services/CsvService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/CsvService', () => ({
  importProjectFromCsv: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('import-csv command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: {} as never,
    })
  })

  it('imports CSV from default directory', async () => {
    if (importCsvCommand.run) {
      await importCsvCommand.run({ args: { csvDir: undefined } } as never)
    }

    expect(importProjectFromCsv).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('csv_exports'))
    expect(consola.success).toHaveBeenCalledWith('Imported translations and saved to JSON files.')
  })

  it('imports CSV from custom directory', async () => {
    if (importCsvCommand.run) {
      await importCsvCommand.run({ args: { csvDir: 'my-csv' } } as never)
    }

    expect(importProjectFromCsv).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('my-csv'))
  })
})
