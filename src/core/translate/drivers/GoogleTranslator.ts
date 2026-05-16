import axios from 'axios'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

const DEFAULT_GOOGLE_HOST = 'translation.googleapis.com'

interface GoogleTranslateResponse {
  data?: {
    translations?: Array<{ translatedText?: string }>
  }
  error?: {
    message?: string
    code?: number
  }
}

function resolveGoogleTranslateUrl(options?: TranslateOptions): string {
  const envEndpoint = process.env.GOOGLE_CLOUD_TRANSLATE_ENDPOINT
  if (envEndpoint) {
    return envEndpoint.replace(/\/+$/, '')
  }

  const apiEndpoint = getStringOption(options, ['apiEndpoint', 'googleApiEndpoint'])
  const host = apiEndpoint
    ? apiEndpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    : DEFAULT_GOOGLE_HOST

  return `https://${host}/language/translate/v2`
}

export class GoogleTranslator implements TranslatorDriver {
  private apiKey: string
  private translateUrl: string

  constructor(apiKey: string, options?: TranslateOptions) {
    this.apiKey = apiKey
    this.translateUrl = resolveGoogleTranslateUrl(options)
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    const translated = await this.translateBatch([text], fromLang, toLang, options)
    return translated[0] || ''
  }

  async translateBatch(
    texts: string[],
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string[]> {
    if (texts.length === 0) {
      return []
    }

    const body: Record<string, unknown> = {
      q: texts.length === 1 ? texts[0] : texts,
      target: toLang,
      format: getStringOption(options, ['format']) ?? 'html',
    }

    if (fromLang) {
      body.source = fromLang
    }

    const model = getStringOption(options, ['model'])
    if (model) {
      body.model = model
    }

    try {
      const response = await axios.post<GoogleTranslateResponse>(
        this.translateUrl,
        body,
        {
          params: {
            key: this.apiKey,
          },
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        },
      )

      const translations = response.data?.data?.translations
      if (!translations?.length) {
        const apiError = response.data?.error?.message
        if (apiError) {
          throw new Error(apiError)
        }
        throw createDriverTypeError('Google Translate', 'No translation found in response')
      }

      const results = translations.map(item => item.translatedText).filter((value): value is string => typeof value === 'string')
      if (results.length !== texts.length) {
        throw createDriverTypeError('Google Translate', 'Invalid response format')
      }
      return results
    }
    catch (error: unknown) {
      throw createDriverError('Google Translate', error)
    }
  }
}
