import { defineCommand } from 'citty'
import { consola } from 'consola'
import { estimateTranslationCost } from '../core/services/EstimateService'
import { printJson, resolveProjectContext, sharedArgs } from './_shared'

function parsePositiveNumber(value: string | undefined, fallback: number, name: string): number {
  const parsed = value ? Number(value) : fallback
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`)
  }
  return parsed
}

export default defineCommand({
  meta: {
    name: 'estimate',
    description: 'Estimate translation tokens and cost before running translate',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    replace: {
      type: 'boolean',
      description: 'Estimate for full re-translation instead of missing keys only',
      default: false,
    },
    inputCostPer1kTokens: {
      type: 'string',
      description: 'Input token price per 1k tokens (USD)',
      default: '0.5',
    },
    outputCostPer1kTokens: {
      type: 'string',
      description: 'Output token price per 1k tokens (USD)',
      default: '1.5',
    },
    outputTokenRatio: {
      type: 'string',
      description: 'Expected output/input token ratio',
      default: '1.0',
    },
    json: {
      type: 'boolean',
      description: 'Output estimate in JSON format',
      default: false,
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const estimate = estimateTranslationCost(project, {
      replace: args.replace,
      inputCostPer1kTokens: parsePositiveNumber(args.inputCostPer1kTokens, 0.5, 'inputCostPer1kTokens'),
      outputCostPer1kTokens: parsePositiveNumber(args.outputCostPer1kTokens, 1.5, 'outputCostPer1kTokens'),
      outputTokenRatio: parsePositiveNumber(args.outputTokenRatio, 1, 'outputTokenRatio'),
    })

    if (args.json) {
      printJson(estimate)
      return
    }

    consola.info('Estimated translation workload:')
    consola.info(`Locales to translate: ${estimate.summary.totalLocales}`)
    consola.info(`Missing keys: ${estimate.summary.totalMissingKeys}`)
    consola.info(`Input chars: ${estimate.summary.totalInputChars}`)
    consola.info(`Input tokens (approx): ${estimate.summary.totalInputTokens}`)
    consola.info(`Output tokens (approx): ${estimate.summary.totalOutputTokens}`)
    consola.info(`Estimated cost (USD): ${estimate.summary.totalEstimatedCost.toFixed(4)}`)
  },
})
