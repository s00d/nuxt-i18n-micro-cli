import { createHash } from 'node:crypto'
import axios from 'axios'
import { cliUsageError } from '../../errors'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError } from './_shared'

const BAIDU_API_URL = 'http://api.fanyi.baidu.com/api/trans/vip/translate'

interface BaiduTranslateResponse {
  trans_result?: Array<{ dst?: string }>
  error_code?: string
  error_msg?: string
}

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
      throw cliUsageError('Baidu Translator requires `apiKey` and `options.appId`.', [
        'Legacy format: --token appId:apiKey',
        'Recommended: --token <apiKey> --options appId:<appId>',
      ])
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
    const salt = options?.salt ?? `${Date.now()}${Math.random()}`
    const sign = createHash('md5')
      .update(`${this.appId}${text}${salt}${this.apiKey}`)
      .digest('hex')

    const body = new URLSearchParams({
      q: text,
      from: fromLang,
      to: toLang,
      appid: this.appId,
      salt,
      sign,
    })

    try {
      const response = await axios.post<BaiduTranslateResponse>(
        BAIDU_API_URL,
        body,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      const data = response.data
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
