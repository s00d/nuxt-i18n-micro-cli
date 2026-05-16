import axios from 'axios'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError } from './_shared'

const PAPAGO_API_URL = 'https://openapi.naver.com/v1/papago/n2mt'

interface PapagoSuccessResponse {
  message?: {
    result?: {
      translatedText?: string
    }
  }
}

interface PapagoErrorResponse {
  errorCode?: string | number
  errorMessage?: string
}

export class PapagoTranslator implements TranslatorDriver {
  private clientId: string
  private clientSecret: string

  constructor(apiKey: string, options?: TranslateOptions) {
    const clientId = typeof options?.clientId === 'string' ? options.clientId : undefined
    if (clientId) {
      this.clientId = clientId
      this.clientSecret = apiKey
      return
    }

    const [legacyClientId, legacyClientSecret] = apiKey.split(':')
    if (!legacyClientId || !legacyClientSecret) {
      throw new Error('Papago Translator requires `apiKey` and `options.clientId` (legacy `clientId:clientSecret` is also supported).')
    }
    this.clientId = legacyClientId
    this.clientSecret = legacyClientSecret
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    try {
      const response = await axios.post<PapagoSuccessResponse & PapagoErrorResponse>(
        PAPAGO_API_URL,
        new URLSearchParams({
          text,
          source: fromLang,
          target: toLang,
        }),
        {
          headers: {
            'X-Naver-Client-Id': this.clientId,
            'X-Naver-Client-Secret': this.clientSecret,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
        },
      )

      const body = response.data
      const translated = body.message?.result?.translatedText
      if (translated) {
        return translated
      }

      const errorCode = body.errorCode
      if (errorCode !== undefined && errorCode !== 0 && errorCode !== '0') {
        throw new Error(body.errorMessage || `Papago error code: ${errorCode}`)
      }

      throw createDriverTypeError('Papago', 'No translation found in response')
    }
    catch (error: unknown) {
      throw createDriverError('Papago', error)
    }
  }
}
