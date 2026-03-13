import { beforeEach, describe, expect, it, vi } from 'vitest'
import searchCommand from '../../src/commands/search'
import { resolveCommandContext, printJson } from '../../src/commands/_shared'
import { searchProjectTranslations } from '../../src/core/services/SearchService'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveCommandContext: vi.fn(),
  printJson: vi.fn(),
}))

vi.mock('../../src/core/services/SearchService', () => ({
  searchProjectTranslations: vi.fn(),
}))

vi.mock('../../src/commands/_render', () => ({
  renderSection: vi.fn(),
  renderStatus: vi.fn(),
  renderKeyValueTable: vi.fn(),
}))

describe('search command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveCommandContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: '/test/project/locales',
      config: {
        locales: [{ code: 'en' }, { code: 'ru' }],
        translationDir: '/test/project/locales',
        translationDirs: ['/test/project/locales'],
      },
    })
    vi.mocked(searchProjectTranslations).mockResolvedValue({
      query: 'hello',
      totalMatches: 0,
      matches: [],
      hardcoded: [],
      scannedSourceFiles: 0,
    } as never)
  })

  it('prints JSON output when json flag is enabled', async () => {
    if (searchCommand.run) {
      await searchCommand.run({ args: { query: 'hello', json: true } } as never)
    }
    expect(printJson).toHaveBeenCalledWith(expect.objectContaining({ query: 'hello' }))
  })

  it('passes filters in text mode', async () => {
    if (searchCommand.run) {
      await searchCommand.run({ args: { query: 'hello', json: false, scope: 'pages', onlyUnused: true, preferUnused: true, hardcodedOnly: false, onlyVue: true, limit: '5' } } as never)
    }
    expect(searchProjectTranslations).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'pages',
      onlyUnused: true,
      preferUnused: true,
      hardcodedOnly: false,
      onlyVue: true,
      limit: 5,
    }))
  })

  it('allows empty query when hardcodedOnly is enabled', async () => {
    if (searchCommand.run) {
      await searchCommand.run({ args: { query: '', hardcodedOnly: true, json: true } } as never)
    }
    expect(searchProjectTranslations).toHaveBeenCalledWith(expect.objectContaining({
      query: '',
      hardcodedOnly: true,
    }))
  })
})
