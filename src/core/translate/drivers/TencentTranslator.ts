import axios from 'axios'
import { cliUsageError } from '../../errors'
import { signTencentCloudTc3 } from '../tencent/tc3-sign'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError } from './_shared'

const TMT_ENDPOINT = 'https://tmt.tencentcloudapi.com/'
const TMT_API_VERSION = '2018-03-21'
const TMT_SERVICE = 'tmt'
const TMT_ACTION = 'TextTranslate'

interface TencentTranslateResponse {
  Response?: {
    TargetText?: string
    Error?: {
      Code?: string
      Message?: string
    }
    RequestId?: string
  }
}

export class TencentTranslator implements TranslatorDriver {
  private secretId: string
  private secretKey: string
  private region: string

  constructor(apiKey: string, options?: TranslateOptions) {
    const secretId = typeof options?.secretId === 'string' ? options.secretId : undefined
    const region = typeof options?.region === 'string' ? options.region : 'ap-guangzhou'

    if (secretId) {
      this.secretId = secretId
      this.secretKey = apiKey
      this.region = region
      return
    }

    const [legacySecretId, legacySecretKey] = apiKey.split(':')
    if (!legacySecretId || !legacySecretKey) {
      throw cliUsageError('Tencent Translator requires `apiKey` and `options.secretId`.', [
        'Legacy format: --token secretId:secretKey',
        'Recommended: --token <secretKey> --options secretId:<id>,region:ap-guangzhou',
      ])
    }
    this.secretId = legacySecretId
    this.secretKey = legacySecretKey
    this.region = region
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    const payload = {
      SourceText: text,
      Source: fromLang,
      Target: toLang,
      ProjectId: 0,
    }
    const timestamp = Math.floor(Date.now() / 1000)
    const authorization = signTencentCloudTc3({
      url: TMT_ENDPOINT,
      payload,
      timestamp,
      service: TMT_SERVICE,
      secretId: this.secretId,
      secretKey: this.secretKey,
    })

    try {
      const response = await axios.post<TencentTranslateResponse>(
        TMT_ENDPOINT,
        payload,
        {
          headers: {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Host': 'tmt.tencentcloudapi.com',
            'X-TC-Action': TMT_ACTION,
            'X-TC-Version': TMT_API_VERSION,
            'X-TC-Timestamp': String(timestamp),
            'X-TC-Region': this.region,
          },
        },
      )

      const responseBody = response.data?.Response
      if (responseBody?.Error) {
        throw new Error(`${responseBody.Error.Message} (${responseBody.Error.Code})`)
      }

      const translated = responseBody?.TargetText
      if (!translated) {
        throw createDriverTypeError('Tencent', 'No translation found in response')
      }
      return translated
    }
    catch (error: unknown) {
      throw createDriverError('Tencent', error)
    }
  }
}
