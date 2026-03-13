import { consola } from 'consola'
import type { I18nProject } from '../Project'
import { translateBatchTexts } from '../translate'
import {
  buildGlossaryContext,
  getGlossaryEntriesForPair,
  type GlossaryCatalog,
} from './GlossaryService'

interface TranslateMissingOptions {
  service: string
  token: string
  options?: Record<string, unknown>
  replace?: boolean
  chunkSize?: number
}

function getKeysToTranslate(
  reference: Record<string, string>,
  target: Record<string, string>,
  replace: boolean,
): string[] {
  return Object.keys(reference).filter((key) => {
    if (replace) {
      return true
    }
    const value = target[key]
    return value === undefined || value === ''
  })
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function getNumericOption(options: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = Number(options?.[key])
    if (Number.isFinite(value)) {
      return value
    }
  }
  return undefined
}

function isLlmService(service: string): boolean {
  return ['openai', 'anthropic', 'mistral', 'cohere', 'groq'].includes(service.toLowerCase())
}

function resolveChunkSize(service: string, configuredChunkSize: number | undefined): number {
  if (typeof configuredChunkSize === 'number' && Number.isFinite(configuredChunkSize)) {
    return Math.max(1, configuredChunkSize)
  }
  if (isLlmService(service)) {
    return 20
  }
  return 50
}

function buildBatches(
  keysToTranslate: string[],
  reference: Record<string, string>,
  chunkSize: number,
  batchMaxChars?: number,
): string[][] {
  if (typeof batchMaxChars !== 'number' || !Number.isFinite(batchMaxChars) || batchMaxChars < 1) {
    return chunkArray(keysToTranslate, chunkSize)
  }

  const chunks: string[][] = []
  let currentChunk: string[] = []
  let currentChars = 0

  for (const key of keysToTranslate) {
    const text = reference[key] ?? ''
    const itemChars = text.length
    const exceedsCount = currentChunk.length >= chunkSize
    const exceedsChars = currentChunk.length > 0 && currentChars + itemChars > batchMaxChars

    if (exceedsCount || exceedsChars) {
      chunks.push(currentChunk)
      currentChunk = []
      currentChars = 0
    }

    currentChunk.push(key)
    currentChars += itemChars
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

function buildTranslationContext(scope: string, keys: string[]): string {
  const previewKeys = keys.slice(0, 10).join(', ')
  const suffix = keys.length > 10 ? ` ... (+${keys.length - 10} more)` : ''
  return `scope=${scope}; keys=${previewKeys}${suffix}`
}

function getGlossaryCatalog(options: Record<string, unknown> | undefined): GlossaryCatalog | undefined {
  const candidate = options?.glossaryCatalog
  if (!candidate || typeof candidate !== 'object') {
    return undefined
  }
  const entries = (candidate as { entries?: unknown }).entries
  if (!Array.isArray(entries)) {
    return undefined
  }
  return candidate as GlossaryCatalog
}

export async function translateMissing(project: I18nProject, config: TranslateMissingOptions): Promise<void> {
  const defaultLocale = project.config.defaultLocale
  const defaultSet = project.getDefaultLocaleSet()
  const defaultGlobal = defaultSet.getFlatGlobalKeys()
  const defaultPageScopes = defaultSet.getPageScopes()
  const chunkSize = resolveChunkSize(config.service, config.chunkSize)
  const batchMaxChars = getNumericOption(config.options, ['batchMaxChars', 'maxBatchChars'])
  const glossaryCatalog = getGlossaryCatalog(config.options)

  for (const locale of project.config.locales) {
    if (locale.code === defaultLocale) {
      continue
    }

    const localeSet = project.getLocale(locale.code)

    const translateScope = async (scope: 'global' | string, reference: Record<string, string>) => {
      const target = scope === 'global' ? localeSet.getFlatGlobalKeys() : localeSet.getFlatPageKeys(scope)
      const keysToTranslate = getKeysToTranslate(reference, target, Boolean(config.replace))
      if (keysToTranslate.length === 0) {
        return
      }

      for (const chunk of buildBatches(keysToTranslate, reference, chunkSize, batchMaxChars)) {
        const sourceTexts = chunk.map(key => reference[key])
        const optionsWithContext: Record<string, unknown> = {
          ...(config.options ?? {}),
        }
        if (isLlmService(config.service)) {
          optionsWithContext.translationContext = buildTranslationContext(scope, chunk)
          if (glossaryCatalog) {
            const glossaryEntries = getGlossaryEntriesForPair(glossaryCatalog, defaultLocale, locale.code)
            const glossaryContext = buildGlossaryContext(glossaryEntries)
            if (glossaryContext) {
              optionsWithContext.glossaryContext = glossaryContext
            }
          }
        }
        const translatedTexts = await translateBatchTexts(
          sourceTexts,
          defaultLocale,
          locale.code,
          config.service,
          config.token,
          optionsWithContext,
        )

        chunk.forEach((key, index) => {
          const translatedValue = translatedTexts[index]
          if (translatedValue) {
            localeSet.setValue(key, translatedValue, scope)
          }
        })
      }
    }

    consola.info(`Translating locale: ${locale.code}`)
    await translateScope('global', defaultGlobal)
    for (const pageScope of defaultPageScopes) {
      await translateScope(pageScope, defaultSet.getFlatPageKeys(pageScope))
    }
  }
}
