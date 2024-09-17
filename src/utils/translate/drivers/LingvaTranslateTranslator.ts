import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

export class LingvaTranslateTranslator implements TranslatorDriver {
  private baseUrl: string

  constructor(_apiKey: string, options?: { [key: string]: string }) {
    this.baseUrl = options?.baseUrl || 'https://lingva.ml'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: { [key: string]: any },
  ): Promise<string> {
    const url = `${this.baseUrl}/api/v1/${fromLang}/${toLang}/${encodeURIComponent(text)}`

    try {
      const response = await axios.get(url)

      const data = response.data

      if (!data || !data.translation) {
        throw new Error('Lingva Translate API error: Invalid response')
      }

      return data.translation
    }
    catch (error: any) {
      throw new Error(`Lingva Translate API error: ${error.message}`)
    }
  }
}
