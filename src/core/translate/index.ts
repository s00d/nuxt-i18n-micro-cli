import pRetry from 'p-retry'
import pLimit from 'p-limit'
import pTimeout from 'p-timeout'
import type { TranslateOptions, TranslatorDriver } from './drivers/TranslatorDriver'
import { I18nProtector, splitPluralForms } from './I18nProtector'
import translatorRegistry from './TranslatorRegistry'

function createTranslator(
  service: string,
  apiKey: string,
  options?: TranslateOptions,
): TranslatorDriver {
  const TranslatorClass = translatorRegistry[service.toLowerCase()]

  if (!TranslatorClass) {
    throw new Error(`Unsupported translation service: ${service}`)
  }

  return new TranslatorClass(apiKey, toStringOptions(options))
}

function toStringOptions(options?: TranslateOptions): Record<string, string> | undefined {
  if (!options) {
    return undefined
  }
  return Object.entries(options).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = String(value)
    }
    return acc
  }, {})
}

function getNumericOption(options: TranslateOptions | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = Number(options?.[key])
    if (Number.isFinite(value)) {
      return value
    }
  }
  return undefined
}

function getBatchConcurrency(options: TranslateOptions | undefined): number | undefined {
  const concurrency = getNumericOption(options, ['batchConcurrency', 'concurrency', 'parallelism'])
  if (typeof concurrency !== 'number') {
    return undefined
  }
  const normalized = Math.floor(concurrency)
  if (!Number.isFinite(normalized) || normalized < 1) {
    return undefined
  }
  return normalized
}

function getPluralSeparator(options: TranslateOptions | undefined): string {
  const raw = options?.pluralSeparator
  return typeof raw === 'string' && raw.length > 0 ? raw : '|'
}

const i18nProtector = new I18nProtector()

async function runWithRetryAndTimeout<T>(
  operation: () => Promise<T>,
  options?: TranslateOptions,
): Promise<T> {
  const timeoutMs = getNumericOption(options, ['requestTimeoutMs', 'timeoutMs'])
  const retries = getNumericOption(options, ['retryCount', 'retries'])
  const retryMinTimeout = getNumericOption(options, ['retryMinTimeoutMs'])

  const executeOnce = async (): Promise<T> => {
    const pending = operation()
    if (typeof timeoutMs === 'number') {
      return pTimeout(pending, { milliseconds: timeoutMs })
    }
    return pending
  }

  if (typeof retries === 'number' && retries > 0) {
    return pRetry(() => executeOnce(), {
      retries,
      minTimeout: retryMinTimeout,
    })
  }

  return executeOnce()
}

export async function translateText(
  text: string,
  fromLang: string,
  toLang: string,
  service: string,
  apiKey: string,
  options?: TranslateOptions,
): Promise<string> {
  const sourceLang = mapLanguageCode(service, fromLang)
  const targetLang = mapLanguageCode(service, toLang)
  const translator = createTranslator(service, apiKey, options)
  const pluralSeparator = getPluralSeparator(options)
  const parts = splitPluralForms(text, pluralSeparator)

  if (parts.length === 1) {
    return translateProtectedText(parts[0], sourceLang, targetLang, translator, options)
  }

  const translatedParts = await Promise.all(
    parts.map(part => translateProtectedText(part, sourceLang, targetLang, translator, options)),
  )
  return translatedParts.join(` ${pluralSeparator} `)
}

export async function translateBatchTexts(
  texts: string[],
  fromLang: string,
  toLang: string,
  service: string,
  apiKey: string,
  options?: TranslateOptions,
): Promise<string[]> {
  if (texts.length === 0) {
    return []
  }

  const sourceLang = mapLanguageCode(service, fromLang)
  const targetLang = mapLanguageCode(service, toLang)
  const translator = createTranslator(service, apiKey, options)
  const pluralSeparator = getPluralSeparator(options)
  const { payloads, resolveResults } = prepareProtectedPayloads(texts, pluralSeparator)
  const translatedPayloads = await runWithRetryAndTimeout(
    () => translatePreparedPayloads(translator, payloads, sourceLang, targetLang, options),
    options,
  )
  return resolveResults(translatedPayloads)
}

function prepareProtectedPayloads(texts: string[], pluralSeparator: string): {
  payloads: string[]
  resolveResults: (translatedPayloads: string[]) => string[]
} {
  const payloads: string[] = []
  const textItems = texts.map((text) => {
    const pluralParts = splitPluralForms(text, pluralSeparator)
    const itemIndexes: number[] = []
    const dictionaries: string[][] = []

    for (const part of pluralParts) {
      const protectedPart = i18nProtector.protect(part)
      itemIndexes.push(payloads.length)
      dictionaries.push(protectedPart.dictionary)
      payloads.push(protectedPart.maskedText)
    }

    return {
      pluralPartsCount: pluralParts.length,
      itemIndexes,
      dictionaries,
    }
  })

  return {
    payloads,
    resolveResults(translatedPayloads: string[]) {
      return textItems.map((item) => {
        const translatedParts = item.itemIndexes.map((index, partIndex) => {
          const translated = translatedPayloads[index] ?? ''
          const dictionary = item.dictionaries[partIndex] ?? []
          return i18nProtector.restore(translated, dictionary)
        })
        if (item.pluralPartsCount > 1) {
          return translatedParts.join(` ${pluralSeparator} `)
        }
        return translatedParts[0] ?? ''
      })
    },
  }
}

async function translatePreparedPayloads(
  translator: TranslatorDriver,
  payloads: string[],
  fromLang: string,
  toLang: string,
  options?: TranslateOptions,
): Promise<string[]> {
  if (translator.translateBatch) {
    return translator.translateBatch(payloads, fromLang, toLang, options)
  }

  const concurrency = getBatchConcurrency(options)
  if (typeof concurrency !== 'number') {
    return Promise.all(
      payloads.map(payload => translator.translate(payload, fromLang, toLang, options)),
    )
  }

  const limit = pLimit(concurrency)
  return Promise.all(
    payloads.map(payload => limit(() => translator.translate(payload, fromLang, toLang, options))),
  )
}

async function translateProtectedText(
  text: string,
  fromLang: string,
  toLang: string,
  translator: TranslatorDriver,
  options?: TranslateOptions,
): Promise<string> {
  const { maskedText, dictionary } = i18nProtector.protect(text)
  const translated = await runWithRetryAndTimeout(
    () => translator.translate(maskedText, fromLang, toLang, options),
    options,
  )
  return i18nProtector.restore(translated, dictionary)
}

const deeplLangMap: { [key: string]: string } = {
  'en': 'EN',
  'en-us': 'EN-US',
  'en-gb': 'EN-GB',
  'de': 'DE',
  'fr': 'FR',
  'es': 'ES',
  'it': 'IT',
  'nl': 'NL',
  'pl': 'PL',
  'pt': 'PT-PT',
  'pt-br': 'PT-BR',
  'ru': 'RU',
  'ja': 'JA',
  'zh': 'ZH',
}

function mapLanguageCode(service: string, lang: string): string {
  switch (service.toLowerCase()) {
    case 'deepl':
      return deeplLangMap[lang.toLowerCase()] || lang.toUpperCase()
    default:
      return lang
  }
}
