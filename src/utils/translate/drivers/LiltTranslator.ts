// src/utils/drivers/LiltTranslator.ts

import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface LiltTranslateResponse {
  data: {
    target: string
  }
  error?: {
    message: string
  }
}

export class LiltTranslator implements TranslatorDriver {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, options?: { [key: string]: string }) {
    if (!apiKey) {
      throw new Error('Lilt Translator requires an apiKey.')
    }
    this.apiKey = apiKey
    this.baseUrl = options?.baseUrl || 'https://api.lilt.com/2'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { memory_id?: number },
  ): Promise<string> {
    const url = `${this.baseUrl}/translate`

    const params = {
      q: text,
      source_lang: fromLang,
      target_lang: toLang,
      memory_id: options?.memory_id,
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${this.apiKey}`,
    }

    try {
      const response = await axios.post<LiltTranslateResponse>(url, params, { headers })

      const data = response.data

      if (data.error) {
        throw new Error(`Lilt API error: ${data.error.message}`)
      }

      return data.data.target
    }
    catch (error: any) {
      throw new Error(`Lilt API error: ${error.message}`)
    }
  }
}
