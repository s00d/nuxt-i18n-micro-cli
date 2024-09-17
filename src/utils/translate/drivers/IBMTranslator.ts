// src/utils/drivers/IBMTranslator.ts

import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface IBMTranslateResponse {
  translations: Array<{
    translation: string
  }>
}

export class IBMTranslator implements TranslatorDriver {
  private apiKey: string
  private url: string
  private version: string

  constructor(apiKey: string, options?: { [key: string]: string }) {
    this.apiKey = apiKey
    this.url = options?.url || 'https://api.us-south.language-translator.watson.cloud.ibm.com/instances/your-instance-id'
    this.version = options?.version || '2022-08-01'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: { [key: string]: any },
  ): Promise<string> {
    const modelId = `${fromLang}-${toLang}`

    try {
      const response = await axios.post<IBMTranslateResponse>(
        `${this.url}/v3/translate?version=${this.version}`,
        {
          text: [text],
          model_id: modelId,
        },
        {
          auth: {
            username: 'apikey',
            password: this.apiKey,
          },
        },
      )

      const data = response.data

      return data.translations[0].translation
    }
    catch (error: any) {
      throw new Error(`IBM Watson API error: ${error.message}`)
    }
  }
}
