// src/utils/drivers/PapagoTranslator.ts

import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface PapagoTranslateResponse {
  message: {
    result: {
      translatedText: string
    }
  }
  errorMessage?: string
  errorCode?: string
}

export class PapagoTranslator implements TranslatorDriver {
  private clientId: string
  private clientSecret: string

  constructor(apiKey: string, _options?: { [key: string]: string }) {
    const [clientId, clientSecret] = apiKey.split(':')
    if (!clientId || !clientSecret) {
      throw new Error('Papago Translator requires apiKey in the format "clientId:clientSecret".')
    }
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: { [key: string]: any },
  ): Promise<string> {
    const url = 'https://openapi.naver.com/v1/papago/n2mt'

    const params = {
      source: fromLang,
      target: toLang,
      text: text,
    }

    try {
      const response = await axios.post<PapagoTranslateResponse>(url, params, {
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
      })

      const data = response.data

      if (data.errorMessage) {
        throw new Error(`Papago API error: ${data.errorMessage} (${data.errorCode})`)
      }

      return data.message.result.translatedText
    }
    catch (error: any) {
      throw new Error(`Papago API error: ${error.message}`)
    }
  }
}
