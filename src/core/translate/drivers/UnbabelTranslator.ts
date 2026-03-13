import axios from 'axios'
import { getTranslatorErrorMessage } from '../error'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'

interface UnbabelTranslateResponse {
  uid: string
  status: string
  translatedText?: string
  target_language?: string
  source_language?: string
  text?: string
}

export class UnbabelTranslator implements TranslatorDriver {
  private apiKey: string
  private username: string
  private baseUrl: string

  constructor(apiKey: string, options?: TranslateOptions) {
    if (!apiKey || typeof options?.username !== 'string') {
      throw new Error('Unbabel Translator requires an apiKey and username.')
    }
    this.apiKey = apiKey
    this.username = options.username
    this.baseUrl = typeof options.baseUrl === 'string' ? options.baseUrl : 'https://api.unbabel.com/tapi/v2'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    const url = `${this.baseUrl}/translation/`

    const data = {
      text: text,
      source_language: fromLang,
      target_language: toLang,
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${this.username}:${this.apiKey}`,
    }

    try {
      const response = await axios.post<UnbabelTranslateResponse>(url, data, { headers })

      const responseData = response.data

      if (responseData.status !== 'completed') {
        throw new Error('Unbabel API error: Translation is not completed yet.')
      }

      return responseData.translatedText || ''
    }
    catch (error: unknown) {
      throw new Error(`Unbabel API error: ${getTranslatorErrorMessage(error)}`)
    }
  }
}
