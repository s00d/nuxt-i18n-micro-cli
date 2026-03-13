import axios from 'axios'
import { withQuery } from 'ufo'
import { getTranslatorErrorMessage } from '../error'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'

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

  constructor(apiKey: string, _options?: TranslateOptions) {
    if (!apiKey) {
      throw new Error('Systran Translator requires an apiKey.')
    }
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    const endpoint = 'https://api-platform.systran.net/translation/text/translate'

    const params = {
      key: this.apiKey,
      input: text,
      source: fromLang,
      target: toLang,
    }
    const url = withQuery(endpoint, params)

    try {
      const response = await axios.get<SystranTranslateResponse>(url)

      const data = response.data

      if (data.error) {
        throw new Error(`Systran API error: ${data.error.message}`)
      }

      return data.outputs[0].output
    }
    catch (error: unknown) {
      throw new Error(`Systran API error: ${getTranslatorErrorMessage(error)}`)
    }
  }
}
