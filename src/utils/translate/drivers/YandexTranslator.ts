// src/utils/drivers/YandexTranslator.ts

import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface YandexTranslateResponse {
  code: number
  lang: string
  text: string[]
  message?: string
}

export class YandexTranslator implements TranslatorDriver {
  private apiKey: string

  constructor(apiKey: string, _options?: { [key: string]: string }) {
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { [key: string]: any },
  ): Promise<string> {
    const url = 'https://translate.yandex.net/api/v1.5/tr.json/translate'

    const params = new URLSearchParams({
      text: text,
      lang: `${fromLang}-${toLang}`,
      key: this.apiKey,
      ...options, // Включаем дополнительные опции
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
    catch (error: any) {
      throw new Error(`Yandex Translate API error: ${error.message}`)
    }
  }
}
