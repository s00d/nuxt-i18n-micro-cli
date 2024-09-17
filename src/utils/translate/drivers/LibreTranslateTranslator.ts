// src/utils/drivers/LibreTranslateTranslator.ts

import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface LibreTranslateResponse {
  translatedText: string
}

export class LibreTranslateTranslator implements TranslatorDriver {
  private baseUrl: string
  private apiKey?: string

  constructor(apiKey?: string, options?: { [key: string]: string }) {
    this.apiKey = apiKey
    this.baseUrl = options?.baseUrl || 'https://libretranslate.com'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: { [key: string]: any },
  ): Promise<string> {
    const url = `${this.baseUrl}/translate`

    const params: { [key: string]: any } = {
      q: text,
      source: fromLang,
      target: toLang,
      format: 'text',
    }

    if (this.apiKey) {
      params['api_key'] = this.apiKey
    }

    try {
      const response = await axios.post<LibreTranslateResponse>(url, params, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = response.data

      if (!data || !data.translatedText) {
        throw new Error('LibreTranslate API error: Invalid response')
      }

      return data.translatedText
    }
    catch (error: any) {
      throw new Error(`LibreTranslate API error: ${error.message}`)
    }
  }
}
