import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import glossaryCommand from '../../src/commands/glossary'
import {
  addGlossaryEntry,
  loadGlossaryCatalog,
  removeGlossaryEntry,
  saveGlossaryCatalog,
} from '../../src/core/services/GlossaryService'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('../../src/core/services/GlossaryService', () => ({
  loadGlossaryCatalog: vi.fn(),
  saveGlossaryCatalog: vi.fn(),
  addGlossaryEntry: vi.fn(),
  removeGlossaryEntry: vi.fn(),
}))

describe('glossary command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadGlossaryCatalog).mockReturnValue({ entries: [] })
    vi.mocked(removeGlossaryEntry).mockReturnValue(0)
  })

  it('adds entry and saves file', async () => {
    if (glossaryCommand.run) {
      await glossaryCommand.run({
        args: {
          action: 'add',
          source: 'Save',
          target: 'Сохранить',
          from: 'en',
          to: 'ru',
        },
      } as never)
    }

    expect(addGlossaryEntry).toHaveBeenCalled()
    expect(saveGlossaryCatalog).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('Glossary entry added'))
  })

  it('lists entries in json mode', async () => {
    vi.mocked(loadGlossaryCatalog).mockReturnValue({
      entries: [{ source: 'Save', target: 'Сохранить', from: 'en', to: 'ru' }],
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    if (glossaryCommand.run) {
      await glossaryCommand.run({
        args: { action: 'list', json: true },
      } as never)
    }

    expect(logSpy).toHaveBeenCalled()
    logSpy.mockRestore()
  })
})
