import { describe, expect, it } from 'vitest'
import { estimateTranslationCost } from '../../src/core/services/EstimateService'

function createProjectFixture() {
  const defaultSet = {
    getFlatGlobalKeys: () => ({
      homeTitle: 'Hello world',
      homeSubtitle: 'More text',
    }),
    getPageScopes: () => ['dashboard'],
    getFlatPageKeys: (scope: string) => scope === 'dashboard'
      ? { title: 'Dashboard title' }
      : {},
  }

  const ruSet = {
    getFlatGlobalKeys: () => ({
      homeTitle: 'Привет мир',
      homeSubtitle: '',
    }),
    getFlatPageKeys: (_scope: string) => ({
      title: '',
    }),
  }

  const enSet = {
    getFlatGlobalKeys: defaultSet.getFlatGlobalKeys,
    getFlatPageKeys: defaultSet.getFlatPageKeys,
  }

  return {
    config: {
      defaultLocale: 'en',
      locales: [{ code: 'en' }, { code: 'ru' }],
    },
    getDefaultLocaleSet: () => defaultSet,
    getLocale: (code: string) => (code === 'en' ? enSet : ruSet),
  }
}

describe('estimateTranslationCost', () => {
  it('estimates only missing keys by default', () => {
    const estimate = estimateTranslationCost(createProjectFixture() as never, {
      replace: false,
      inputCostPer1kTokens: 0.5,
      outputCostPer1kTokens: 1.5,
      outputTokenRatio: 1,
    })

    expect(estimate.summary.totalLocales).toBe(1)
    expect(estimate.summary.totalMissingKeys).toBe(2)
    expect(estimate.summary.totalInputChars).toBe('More textDashboard title'.length)
    expect(estimate.summary.totalInputTokens).toBeGreaterThan(0)
    expect(estimate.summary.totalEstimatedCost).toBeGreaterThan(0)
  })

  it('includes all keys when replace is enabled', () => {
    const estimate = estimateTranslationCost(createProjectFixture() as never, {
      replace: true,
      inputCostPer1kTokens: 0.5,
      outputCostPer1kTokens: 1.5,
      outputTokenRatio: 1,
    })

    expect(estimate.summary.totalMissingKeys).toBe(3)
  })
})
