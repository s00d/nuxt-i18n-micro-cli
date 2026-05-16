import axios from 'axios'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getNumericOption, getStringOption } from './_shared'

interface LiltTranslateResponse {
  translation?: Array<{ target?: string }>
}

export class LiltTranslator implements TranslatorDriver {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, options?: TranslateOptions) {
    if (!apiKey) {
      throw new Error('Lilt Translator requires an apiKey.')
    }
    this.apiKey = apiKey
    const baseUrl = getStringOption(options, ['baseUrl']) ?? 'https://api.lilt.com'
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    const memoryId = getNumericOption(options, ['memory_id', 'memoryId']) ?? 0
    const auth = Buffer.from(`${this.apiKey}:${this.apiKey}`).toString('base64')

    try {
      const response = await axios.post<LiltTranslateResponse>(
        `${this.baseUrl}/v2/translate`,
        {
          source: text,
          source_lang: fromLang,
          target_lang: toLang,
          memory_id: memoryId,
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        },
      )

      const translated = response.data?.translation?.[0]?.target
      if (!translated || typeof translated !== 'string') {
        throw createDriverTypeError('Lilt', 'No translation found in response')
      }
      return translated
    }
    catch (error: unknown) {
      throw createDriverError('Lilt', error)
    }
  }
}
