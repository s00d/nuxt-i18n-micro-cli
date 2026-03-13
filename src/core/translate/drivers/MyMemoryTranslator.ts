import axios from 'axios'
import { withQuery } from 'ufo'
import { getTranslatorErrorMessage } from '../error'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'

interface MyMemoryResponse {
  responseData: {
    translatedText: string
  }
  responseStatus: number
  responseDetails: string
}

export class MyMemoryTranslator implements TranslatorDriver {
  private apiKey?: string

  constructor(apiKey: string, _options?: TranslateOptions) {
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    const endpoint = 'https://api.mymemory.translated.net/get'

    const params: Record<string, string> = {
      q: text,
      langpair: `${fromLang}|${toLang}`,
    }

    if (this.apiKey) {
      params.key = this.apiKey
    }
    const url = withQuery(endpoint, params)

    try {
      const response = await axios.get<MyMemoryResponse>(url)

      const data = response.data

      if (data.responseStatus !== 200) {
        throw new Error(`MyMemory API error: ${data.responseDetails}`)
      }

      return data.responseData.translatedText
    }
    catch (error: unknown) {
      throw new Error(`MyMemory API error: ${getTranslatorErrorMessage(error)}`)
    }
  }
}
