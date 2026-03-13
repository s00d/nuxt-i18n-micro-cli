import axios from 'axios'
import { getTranslatorErrorMessage } from '../error'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'

interface YandexTranslateResponse {
  code: number
  lang: string
  text: string[]
  message?: string
}

export class YandexTranslator implements TranslatorDriver {
  private apiKey: string

  constructor(apiKey: string, _options?: TranslateOptions) {
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    const url = 'https://translate.yandex.net/api/v1.5/tr.json/translate'
    const normalizedOptions = normalizeOptions(options)

    const params = new URLSearchParams({
      text: text,
      lang: `${fromLang}-${toLang}`,
      key: this.apiKey,
      format: normalizedOptions.format ?? 'html',
      ...normalizedOptions,
    })

    try {
      const response = await axios.post<YandexTranslateResponse>(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      const data = response.data

      if (data.code !== 200) {
        throw new Error(`Yandex Translate API error: ${data.message || data.code}`)
      }

      return data.text[0]
    }
    catch (error: unknown) {
      throw new Error(`Yandex Translate API error: ${getTranslatorErrorMessage(error)}`)
    }
  }
}

function normalizeOptions(options?: TranslateOptions): Record<string, string> {
  if (!options) {
    return {}
  }

  return Object.entries(options).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = String(value)
    }
    return acc
  }, {})
}
