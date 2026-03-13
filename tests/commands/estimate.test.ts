import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import estimateCommand from '../../src/commands/estimate'
import { estimateTranslationCost } from '../../src/core/services/EstimateService'
import { printJson, resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
  },
}))

vi.mock('../../src/core/services/EstimateService', () => ({
  estimateTranslationCost: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
  printJson: vi.fn(),
}))

describe('estimate command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: { defaultLocale: 'en', locales: [{ code: 'en' }, { code: 'ru' }] } as never,
      project: {} as never,
    })
    vi.mocked(estimateTranslationCost).mockReturnValue({
      summary: {
        totalLocales: 1,
        totalMissingKeys: 10,
        totalInputChars: 100,
        totalInputTokens: 25,
        totalOutputTokens: 30,
        totalEstimatedCost: 0.12,
      },
      locales: [],
    } as never)
  })

  it('prints json output when json flag is enabled', async () => {
    if (estimateCommand.run) {
      await estimateCommand.run({
        args: {
          json: true,
          replace: false,
          inputCostPer1kTokens: '0.5',
          outputCostPer1kTokens: '1.5',
          outputTokenRatio: '1.2',
        },
      } as never)
    }

    expect(estimateTranslationCost).toHaveBeenCalled()
    expect(printJson).toHaveBeenCalled()
  })

  it('prints human-readable summary in text mode', async () => {
    if (estimateCommand.run) {
      await estimateCommand.run({
        args: {
          json: false,
          replace: false,
          inputCostPer1kTokens: '0.5',
          outputCostPer1kTokens: '1.5',
          outputTokenRatio: '1.2',
        },
      } as never)
    }

    expect(consola.info).toHaveBeenCalledWith(expect.stringContaining('Estimated translation workload'))
  })
})
