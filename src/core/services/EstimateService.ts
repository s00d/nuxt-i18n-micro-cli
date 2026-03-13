import type { I18nProject } from '../Project'

export interface EstimateOptions {
  replace?: boolean
  inputCostPer1kTokens: number
  outputCostPer1kTokens: number
  outputTokenRatio: number
}

export interface LocaleEstimate {
  code: string
  missingKeys: number
  inputChars: number
  inputTokens: number
  outputTokens: number
  estimatedCost: number
}

export interface EstimateResult {
  summary: {
    totalLocales: number
    totalMissingKeys: number
    totalInputChars: number
    totalInputTokens: number
    totalOutputTokens: number
    totalEstimatedCost: number
  }
  locales: LocaleEstimate[]
}

function estimateTokens(text: string): number {
  // Approximation used for rough budgeting.
  return Math.max(1, Math.ceil(text.length / 4))
}

function getKeysToTranslate(reference: Record<string, string>, target: Record<string, string>, replace: boolean): string[] {
  return Object.keys(reference).filter((key) => {
    if (replace) {
      return true
    }
    const value = target[key]
    return value === undefined || value === ''
  })
}

export function estimateTranslationCost(project: I18nProject, options: EstimateOptions): EstimateResult {
  const defaultLocale = project.config.defaultLocale
  const defaultSet = project.getDefaultLocaleSet()
  const defaultGlobal = defaultSet.getFlatGlobalKeys()
  const pageScopes = defaultSet.getPageScopes()
  const replace = Boolean(options.replace)
  const locales: LocaleEstimate[] = []

  for (const locale of project.config.locales) {
    if (locale.code === defaultLocale) {
      continue
    }

    const localeSet = project.getLocale(locale.code)
    let missingKeys = 0
    let inputChars = 0
    let inputTokens = 0

    const globalKeys = getKeysToTranslate(defaultGlobal, localeSet.getFlatGlobalKeys(), replace)
    for (const key of globalKeys) {
      const text = defaultGlobal[key] ?? ''
      missingKeys += 1
      inputChars += text.length
      inputTokens += estimateTokens(text)
    }

    for (const pageScope of pageScopes) {
      const reference = defaultSet.getFlatPageKeys(pageScope)
      const target = localeSet.getFlatPageKeys(pageScope)
      const keys = getKeysToTranslate(reference, target, replace)
      for (const key of keys) {
        const text = reference[key] ?? ''
        missingKeys += 1
        inputChars += text.length
        inputTokens += estimateTokens(text)
      }
    }

    const outputTokens = Math.ceil(inputTokens * options.outputTokenRatio)
    const estimatedCost
      = (inputTokens / 1000) * options.inputCostPer1kTokens
        + (outputTokens / 1000) * options.outputCostPer1kTokens

    locales.push({
      code: locale.code,
      missingKeys,
      inputChars,
      inputTokens,
      outputTokens,
      estimatedCost,
    })
  }

  return {
    summary: {
      totalLocales: locales.length,
      totalMissingKeys: locales.reduce((sum, item) => sum + item.missingKeys, 0),
      totalInputChars: locales.reduce((sum, item) => sum + item.inputChars, 0),
      totalInputTokens: locales.reduce((sum, item) => sum + item.inputTokens, 0),
      totalOutputTokens: locales.reduce((sum, item) => sum + item.outputTokens, 0),
      totalEstimatedCost: locales.reduce((sum, item) => sum + item.estimatedCost, 0),
    },
    locales,
  }
}
