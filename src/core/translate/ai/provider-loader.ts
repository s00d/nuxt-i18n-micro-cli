import type { LanguageModelV3 } from '@ai-sdk/provider'
import { createGateway } from 'ai'
import type { TranslateOptions } from '../drivers/TranslatorDriver'
import { getStringOption } from '../drivers/_shared'

export const GATEWAY_PROVIDER_ID = 'gateway'

const PROVIDER_PACKAGE_BY_ID: Record<string, string> = {
  gateway: '@ai-sdk/gateway',
  openai: '@ai-sdk/openai',
  anthropic: '@ai-sdk/anthropic',
  mistral: '@ai-sdk/mistral',
  cohere: '@ai-sdk/cohere',
  groq: '@ai-sdk/groq',
  google: '@ai-sdk/google',
  xai: '@ai-sdk/xai',
  deepseek: '@ai-sdk/deepseek',
  perplexity: '@ai-sdk/perplexity',
}

const PROVIDER_FACTORY_BY_ID: Record<string, string> = {
  gateway: 'createGateway',
  openai: 'createOpenAI',
  anthropic: 'createAnthropic',
  mistral: 'createMistral',
  cohere: 'createCohere',
  groq: 'createGroq',
  google: 'createGoogleGenerativeAI',
  xai: 'createXAI',
  deepseek: 'createDeepSeek',
  perplexity: 'createPerplexity',
}

type ProviderModule = Record<string, unknown>

type AiProviderFactory = (options: { apiKey: string }) => {
  languageModel: (modelId: string) => LanguageModelV3
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}

function resolveProviderPackage(provider: string, options?: TranslateOptions): string {
  const explicit = getStringOption(options, ['providerPackage', 'providerModule'])
  if (explicit) {
    return explicit
  }

  const known = PROVIDER_PACKAGE_BY_ID[provider]
  if (known) {
    return known
  }

  if (provider.startsWith('@')) {
    return provider
  }

  return `@ai-sdk/${provider}`
}

function resolveProviderFactory(provider: string, options?: TranslateOptions): string {
  const explicit = getStringOption(options, ['providerFactory', 'createProvider'])
  if (explicit) {
    return explicit
  }

  const known = PROVIDER_FACTORY_BY_ID[provider]
  if (known) {
    return known
  }

  return `create${toPascalCase(provider)}`
}

async function loadProviderModule(packageName: string): Promise<ProviderModule> {
  try {
    return await import(packageName) as ProviderModule
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to load AI provider package "${packageName}". Install it in your project (e.g. pnpm add ${packageName}). ${message}`,
    )
  }
}

function resolveProviderFactoryFromModule(
  module: ProviderModule,
  factoryName: string,
  packageName: string,
): AiProviderFactory {
  const factory = module[factoryName]
  if (typeof factory === 'function') {
    return factory as AiProviderFactory
  }

  const defaultExport = module.default
  if (typeof defaultExport === 'function') {
    return defaultExport as AiProviderFactory
  }

  throw new Error(
    `Provider factory "${factoryName}" was not found in "${packageName}". Set providerFactory in --options.`,
  )
}

export async function resolveLanguageModel(
  provider: string,
  model: string,
  apiKey: string,
  options?: TranslateOptions,
): Promise<LanguageModelV3> {
  if (provider === GATEWAY_PROVIDER_ID) {
    const gateway = createGateway({ apiKey })
    return gateway.languageModel(model)
  }

  const packageName = resolveProviderPackage(provider, options)
  const factoryName = resolveProviderFactory(provider, options)
  const module = await loadProviderModule(packageName)
  const createProvider = resolveProviderFactoryFromModule(module, factoryName, packageName)
  const providerClient = createProvider({ apiKey })

  if (typeof providerClient.languageModel !== 'function') {
    throw new TypeError(`Package "${packageName}" does not expose languageModel().`)
  }

  return providerClient.languageModel(model)
}

export function listKnownProviderIds(): string[] {
  return Object.keys(PROVIDER_PACKAGE_BY_ID)
}
