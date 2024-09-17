// src/utils/drivers/GoogleTranslator.ts

import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
  error?: {
    code: number
    message: string
    status: string
  }
}

export class GoogleTranslator implements TranslatorDriver {
  private apiKey: string

  constructor(apiKey: string, _options?: { [key: string]: string }) {
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: {
      format?: string
      model?: string
      glossaryConfig?: any
    },
  ): Promise<string> {
    const url = 'https://translation.googleapis.com/language/translate/v2'

    const params: { [key: string]: any } = {
      q: text,
      target: toLang,
      format: 'html',
      key: this.apiKey,
      ...options, // Включаем дополнительные опции
    }

    if (fromLang) {
      params.source = fromLang
    }

    try {
      const response = await axios.get<GoogleTranslateResponse>(url, { params })
      const data = response.data

      if (data.error) {
        throw new Error(`Google Translate API error: ${data.error.message}`)
      }

      return data.data.translations[0].translatedText
    }
    catch (error: any) {
      throw new Error(`Google Translate API error: ${error.message}`)
    }
  }
}
