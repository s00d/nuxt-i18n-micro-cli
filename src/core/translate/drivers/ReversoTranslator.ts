import ReversoApi from 'reverso-api'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

export class ReversoTranslator implements TranslatorDriver {
  private client: InstanceType<typeof ReversoApi>

  constructor(_apiKey: string, _options?: TranslateOptions) {
    this.client = new ReversoApi()
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    try {
      const source = toReversoLang(fromLang, getStringOption(options, ['reversoFrom']))
      const target = toReversoLang(toLang, getStringOption(options, ['reversoTo']))
      const result = await this.client.getTranslation(text, source, target) as {
        ok: boolean
        translations?: string[]
        message?: string
      }
      if (!result.ok) {
        throw new Error(result.message || 'Unknown Reverso error')
      }
      const translated = result.translations?.[0]
      if (!translated) {
        throw createDriverTypeError('Reverso', 'No translation found in response')
      }
      return translated
    }
    catch (error: unknown) {
      throw createDriverError('Reverso', error)
    }
  }
}

function toReversoLang(language: string, fallback?: string): string {
  const normalized = language.toLowerCase()
  const map: Record<string, string> = {
    ar: 'arabic',
    de: 'german',
    en: 'english',
    es: 'spanish',
    fr: 'french',
    he: 'hebrew',
    it: 'italian',
    ja: 'japanese',
    nl: 'dutch',
    pl: 'polish',
    pt: 'portuguese',
    ro: 'romanian',
    ru: 'russian',
    tr: 'turkish',
    uk: 'ukrainian',
    zh: 'chinese',
  }
  return map[normalized] ?? fallback ?? normalized
}
