import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface UnbabelTranslateResponse {
  uid: string
  status: string
  translatedText?: string
  target_language?: string
  source_language?: string
  text?: string
  // ... другие поля
}

export class UnbabelTranslator implements TranslatorDriver {
  private apiKey: string
  private username: string
  private baseUrl: string

  constructor(apiKey: string, options?: { [key: string]: string }) {
    if (!apiKey || !options?.username) {
      throw new Error('Unbabel Translator requires an apiKey and username.')
    }
    this.apiKey = apiKey
    this.username = options.username
    this.baseUrl = options?.baseUrl || 'https://api.unbabel.com/tapi/v2'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: { [key: string]: any },
  ): Promise<string> {
    const url = `${this.baseUrl}/translation/`

    const data = {
      text: text,
      source_language: fromLang,
      target_language: toLang,
      // Дополнительные параметры
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${this.username}:${this.apiKey}`,
    }

    try {
      const response = await axios.post<UnbabelTranslateResponse>(url, data, { headers })

      const responseData = response.data

      if (responseData.status !== 'completed') {
        // Перевод обрабатывается; Unbabel API является асинхронным
        // Необходимо реализовать опрос статуса или обработку обратных вызовов
        throw new Error('Unbabel API error: Translation is not completed yet.')
      }

      return responseData.translatedText || ''
    }
    catch (error: any) {
      throw new Error(`Unbabel API error: ${error.message}`)
    }
  }
}
