import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface SystranTranslateResponse {
  outputs: Array<{
    output: string
  }>
  error?: {
    message: string
  }
}

export class SystranTranslator implements TranslatorDriver {
  private apiKey: string

  constructor(apiKey: string, _options?: { [key: string]: string }) {
    if (!apiKey) {
      throw new Error('Systran Translator requires an apiKey.')
    }
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: { [key: string]: any },
  ): Promise<string> {
    const url = 'https://api-platform.systran.net/translation/text/translate'

    const params = {
      key: this.apiKey,
      input: text,
      source: fromLang,
      target: toLang,
    }

    try {
      const response = await axios.get<SystranTranslateResponse>(url, { params })

      const data = response.data

      if (data.error) {
        throw new Error(`Systran API error: ${data.error.message}`)
      }

      return data.outputs[0].output
    }
    catch (error: any) {
      throw new Error(`Systran API error: ${error.message}`)
    }
  }
}
