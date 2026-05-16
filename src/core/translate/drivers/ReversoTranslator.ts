import axios from 'axios'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

const REVERSO_TRANSLATION_URL = 'https://api.reverso.net/translate/v1/translation'

const REVERSO_API_LANGUAGE_CODES: Record<string, string> = {
  arabic: 'ara',
  german: 'ger',
  spanish: 'spa',
  french: 'fra',
  hebrew: 'heb',
  italian: 'ita',
  japanese: 'jpn',
  dutch: 'dut',
  polish: 'pol',
  portuguese: 'por',
  romanian: 'rum',
  russian: 'rus',
  ukrainian: 'ukr',
  turkish: 'tur',
  chinese: 'chi',
  english: 'eng',
}

interface ReversoTranslationResponse {
  translation?: string[]
  contextResults?: {
    results?: Array<{ translation?: string }>
  }
}

export class ReversoTranslator implements TranslatorDriver {
  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    const source = toReversoApiCode(fromLang, getStringOption(options, ['reversoFrom']))
    const target = toReversoApiCode(toLang, getStringOption(options, ['reversoTo']))

    try {
      const response = await axios.post<ReversoTranslationResponse>(
        REVERSO_TRANSLATION_URL,
        {
          format: 'text',
          from: source,
          input: text,
          options: {
            contextResults: true,
            languageDetection: true,
            origin: 'reversomobile',
            sentenceSplitter: false,
          },
          to: target,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
          },
        },
      )

      const data = response.data
      const translations = [
        ...(data.translation ?? []),
        ...(data.contextResults?.results?.map(result => result.translation) ?? []),
      ].filter((value): value is string => typeof value === 'string' && value.length > 0)

      const translated = translations[0]
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

function toReversoApiCode(language: string, fallback?: string): string {
  const reversoLang = toReversoLang(language, fallback)
  return REVERSO_API_LANGUAGE_CODES[reversoLang] ?? reversoLang
}
