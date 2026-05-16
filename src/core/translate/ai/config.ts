import { z } from 'zod'
import type { TranslateOptions } from '../drivers/TranslatorDriver'
import { GATEWAY_PROVIDER_ID } from './provider-loader'

export const translationOutputSchema = z.object({
  translation: z.string().describe('Translated text only, preserving placeholders and markup'),
})

export type TranslationOutput = z.infer<typeof translationOutputSchema>

export interface ResolvedAiTranslationConfig {
  provider: string
  model: string
  maxTokens: number
  temperature: number
  topP?: number
}

const DEFAULT_PROVIDER = GATEWAY_PROVIDER_ID
const DEFAULT_GATEWAY_MODEL = 'anthropic/claude-sonnet-4.5'

export function isLlmTranslationService(service: string): boolean {
  return service.toLowerCase() === 'ai'
}

function readStringOption(options: TranslateOptions | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = options?.[key]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }
  return undefined
}

function readNumberOption(options: TranslateOptions | undefined, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = Number(options?.[key])
    if (Number.isFinite(value)) {
      return value
    }
  }
  return fallback
}

function resolveProvider(options: TranslateOptions | undefined): string {
  return readStringOption(options, ['provider'])?.toLowerCase() ?? DEFAULT_PROVIDER
}

function resolveModel(provider: string, options: TranslateOptions | undefined): string {
  const direct = readStringOption(options, ['model'])
  if (direct) {
    return direct
  }

  if (provider === GATEWAY_PROVIDER_ID) {
    return DEFAULT_GATEWAY_MODEL
  }

  throw new Error(
    `AI translation requires "model" in --options. For gateway use provider/model format (e.g. model:anthropic/claude-sonnet-4.5).`,
  )
}

export function resolveAiTranslationConfig(
  options?: TranslateOptions,
): ResolvedAiTranslationConfig {
  const provider = resolveProvider(options)
  const model = resolveModel(provider, options)

  if (provider === GATEWAY_PROVIDER_ID && !model.includes('/')) {
    throw new Error(
      'Gateway models must use the "provider/model" format (e.g. model:anthropic/claude-sonnet-4.5).',
    )
  }

  return {
    provider,
    model,
    maxTokens: readNumberOption(options, ['maxTokens', 'max_tokens'], 1024),
    temperature: readNumberOption(options, ['temperature'], 0.2),
    topP: readNumberOption(options, ['topP', 'top_p'], Number.NaN) || undefined,
  }
}

function resolveEnvApiKey(envName: string): string | undefined {
  return process.env[envName]?.trim() || undefined
}

export function resolveAiApiKey(provider: string, token: string): string {
  const trimmed = token.trim()
  if (trimmed) {
    return trimmed
  }

  if (provider === GATEWAY_PROVIDER_ID) {
    const gatewayKey = resolveEnvApiKey('AI_GATEWAY_API_KEY')
    if (gatewayKey) {
      return gatewayKey
    }
    throw new Error('AI gateway requires --token or AI_GATEWAY_API_KEY environment variable.')
  }

  const envName = `${provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`
  const providerKey = resolveEnvApiKey(envName)
  if (providerKey) {
    return providerKey
  }

  throw new Error(
    `AI provider "${provider}" requires --token or ${envName} environment variable.`,
  )
}
