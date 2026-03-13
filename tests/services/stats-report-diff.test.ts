import { describe, expect, it } from 'vitest'
import { buildStatsDiff, type StatsReport } from '../../src/core/services/StatsReportService'

function createReport(completion: number, translatedKeys: number, totalKeys: number): StatsReport {
  return {
    locales: [{
      code: 'ru',
      global: {} as never,
      pages: {},
      combined: {
        totalKeys,
        translatedKeys,
        completion,
      } as never,
    }],
    summary: {
      totalLocales: 1,
      totalFiles: 1,
      totalKeys,
      averageCompletion: completion,
      localesByCompletion: [{ code: 'ru', completion }],
      mostTranslatedLocale: 'ru',
      leastTranslatedLocale: 'ru',
    },
  }
}

describe('buildStatsDiff', () => {
  it('calculates summary and locale deltas', () => {
    const previous = createReport(40, 4, 10)
    const current = createReport(70, 7, 12)

    const diff = buildStatsDiff(current, previous, 'HEAD~1')

    expect(diff.baseRef).toBe('HEAD~1')
    expect(diff.summary).toEqual({
      averageCompletionDelta: 30,
      totalKeysDelta: 2,
    })
    expect(diff.locales).toEqual([{
      code: 'ru',
      completionDelta: 30,
      translatedKeysDelta: 3,
      totalKeysDelta: 2,
    }])
  })
})
