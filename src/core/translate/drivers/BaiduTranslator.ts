import baiduTranslateService from 'baidu-translate-service'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError } from './_shared'

export class BaiduTranslator implements TranslatorDriver {
  private apiKey: string
  private appId: string

  constructor(apiKey: string, options?: TranslateOptions) {
    const appId = typeof options?.appId === 'string' ? options.appId : undefined
    if (appId) {
      this.appId = appId
      this.apiKey = apiKey
      return
    }

    const [legacyAppId, legacyApiKey] = apiKey.split(':')
    if (!legacyAppId || !legacyApiKey) {
      throw new Error('Baidu Translator requires `apiKey` and `options.appId` (legacy `appId:apiKey` is also supported).')
    }
    this.appId = legacyAppId
    this.apiKey = legacyApiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: { salt?: string },
  ): Promise<string> {
    const query = {
      q: text,
      from: fromLang,
      to: toLang,
      appid: this.appId,
      key: this.apiKey,
      ...(options?.salt ? { salt: options.salt } : {}),
    }

    try {
      const response = await baiduTranslateService(query)
      const data = await response.json() as {
        trans_result?: Array<{ dst?: string }>
        error_code?: string
        error_msg?: string
      }
      if (data.error_code) {
        throw new Error(`${data.error_msg} (${data.error_code})`)
      }
      const translated = data.trans_result?.[0]?.dst
      if (!translated) {
        throw createDriverTypeError('Baidu Translate', 'No translation found in response')
      }
      return translated
    }
    catch (error: unknown) {
      throw createDriverError('Baidu Translate', error)
    }
  }
}
