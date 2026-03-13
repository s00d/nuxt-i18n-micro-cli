import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import statsCommand from '../../src/commands/stats'
import { printJson, printKeyValueLines, resolveProjectContext } from '../../src/commands/_shared'
import { buildStatsInput, buildStatsInputFromGitRef } from '../../src/core/services/StatsService'
import { buildStatsDiff, buildStatsReport, generateStatsHtmlReport } from '../../src/core/services/StatsReportService'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  printCompletionStats: vi.fn(),
  printKeyValueLines: vi.fn(),
  printJson: vi.fn(),
  resolveProjectContext: vi.fn(),
}))

vi.mock('../../src/core/services/StatsService', () => ({
  buildStatsInput: vi.fn(),
  buildStatsInputFromGitRef: vi.fn(),
}))

vi.mock('../../src/core/services/StatsReportService', () => ({
  buildStatsReport: vi.fn(),
  buildStatsDiff: vi.fn(),
  generateStatsHtmlReport: vi.fn(),
}))

describe('stats command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: {} as never,
    })
    vi.mocked(buildStatsInput).mockReturnValue({} as never)
    vi.mocked(buildStatsInputFromGitRef).mockReturnValue({} as never)
    vi.mocked(buildStatsReport).mockReturnValue({
      locales: [
        { code: 'en', combined: { totalKeys: 10, translatedKeys: 10, completion: 100 }, global: { totalKeys: 10, translatedKeys: 10, completion: 100, averageKeyLength: 1, averageValueLength: 1, specialCharsCount: 0, emptyValues: 0, duplicateValues: [], formattingIssues: [], valueTypes: { strings: 1, numbers: 0, booleans: 0, arrays: 0, objects: 0 }, stringLengths: { short: 1, medium: 0, long: 0, veryLong: 0 }, htmlTags: { count: 0, tags: [] }, variables: { count: 0, examples: [] }, specialChars: { punctuation: 0, emoji: 0, currency: 0, other: 0 }, wordStats: { totalWords: 0, uniqueWords: 0, averageWordLength: 0, repeatedWords: [] }, caseStats: { upperCase: 0, lowerCase: 1, titleCase: 0, mixedCase: 0 } }, pages: {} },
      ],
      summary: {
        totalLocales: 1,
        totalFiles: 1,
        totalKeys: 10,
        averageCompletion: 100,
        localesByCompletion: [{ code: 'en', completion: 100 }],
        mostTranslatedLocale: 'en',
        leastTranslatedLocale: 'en',
      },
    } as never)
    vi.mocked(buildStatsDiff).mockReturnValue({
      baseRef: 'HEAD~1',
      summary: {
        averageCompletionDelta: 10,
        totalKeysDelta: 2,
      },
      locales: [{ code: 'en', completionDelta: 10, translatedKeysDelta: 2, totalKeysDelta: 2 }],
    } as never)
  })

  it('prints compact stats by default', async () => {
    if (statsCommand.run) {
      await statsCommand.run({ args: { full: false, html: '' } } as never)
    }
    expect(buildStatsInput).toHaveBeenCalled()
    expect(buildStatsReport).toHaveBeenCalled()
    expect(consola.info).toHaveBeenCalledWith(expect.stringContaining('Combined translations: en'))
    expect(printKeyValueLines).not.toHaveBeenCalled()
  })

  it('prints json report when json flag is enabled', async () => {
    if (statsCommand.run) {
      await statsCommand.run({ args: { json: true, full: false, html: '' } } as never)
    }
    expect(printJson).toHaveBeenCalled()
  })

  it('generates html report when requested', async () => {
    if (statsCommand.run) {
      await statsCommand.run({ args: { full: false, html: 'report.html' } } as never)
    }
    expect(generateStatsHtmlReport).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('HTML report generated:'))
  })

  it('builds diff from git reference and includes it in json output', async () => {
    if (statsCommand.run) {
      await statsCommand.run({ args: { json: true, full: false, html: '', baseRef: 'HEAD~1' } } as never)
    }

    expect(buildStatsInputFromGitRef).toHaveBeenCalledWith(expect.anything(), 'HEAD~1')
    expect(buildStatsDiff).toHaveBeenCalled()
    expect(printJson).toHaveBeenCalledWith(expect.objectContaining({
      diff: expect.objectContaining({
        baseRef: 'HEAD~1',
      }),
    }))
  })
})
