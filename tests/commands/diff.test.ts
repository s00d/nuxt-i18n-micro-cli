import { beforeEach, describe, expect, it, vi } from 'vitest'
import diffCommand from '../../src/commands/diff'
import { buildProjectDiff } from '../../src/core/services/DiffService'
import { printJson, resolveProjectContext } from '../../src/commands/_shared'
import { renderKeyValueTable, renderList, renderSection, renderStatus } from '../../src/commands/_render'

vi.mock('../../src/core/services/DiffService', () => ({
  buildProjectDiff: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
  printJson: vi.fn(),
}))

vi.mock('../../src/commands/_render', () => ({
  renderSection: vi.fn(),
  renderStatus: vi.fn(),
  renderKeyValueTable: vi.fn(),
  renderList: vi.fn(),
}))

describe('diff command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: {} as never,
    })
  })

  it('prints json when json flag is enabled', async () => {
    vi.mocked(buildProjectDiff).mockReturnValue([{ file: 'en.json', missingInLocale: [] }] as never)
    if (diffCommand.run) {
      await diffCommand.run({ args: { json: true } } as never)
    }
    expect(printJson).toHaveBeenCalled()
  })

  it('renders pretty output when issues exist', async () => {
    vi.mocked(buildProjectDiff).mockReturnValue([{
      file: 'en.json',
      missingInLocale: [{ key: 'welcome', defaultValue: 'Welcome' }],
    }] as never)
    if (diffCommand.run) {
      await diffCommand.run({ args: { json: false } } as never)
    }
    expect(renderSection).toHaveBeenCalledWith('Translation Diff')
    expect(renderKeyValueTable).toHaveBeenCalled()
    expect(renderStatus).toHaveBeenCalledWith('warn', expect.stringContaining('File: en.json'))
    expect(renderList).toHaveBeenCalled()
  })

  it('renders success status when there are no issues', async () => {
    vi.mocked(buildProjectDiff).mockReturnValue([] as never)
    if (diffCommand.run) {
      await diffCommand.run({ args: { json: false } } as never)
    }
    expect(renderStatus).toHaveBeenCalledWith('success', 'No missing translations found')
  })
})
