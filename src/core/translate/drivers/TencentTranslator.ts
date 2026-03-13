import { tmt } from 'tencentcloud-sdk-nodejs-tmt/tencentcloud/services/tmt/index.js'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError } from './_shared'

interface TencentTmtClient {
  TextTranslate(request: {
    SourceText: string
    Source: string
    Target: string
    ProjectId: number
  }): Promise<{ TargetText?: string }>
}

export class TencentTranslator implements TranslatorDriver {
  private client: TencentTmtClient

  constructor(apiKey: string, options?: TranslateOptions) {
    const secretId = typeof options?.secretId === 'string' ? options.secretId : undefined
    const region = typeof options?.region === 'string' ? options.region : 'ap-guangzhou'

    if (secretId) {
      this.client = new tmt.v20180321.Client({
        credential: {
          secretId,
          secretKey: apiKey,
        },
        region,
      }) as unknown as TencentTmtClient
      return
    }

    const [legacySecretId, legacySecretKey] = apiKey.split(':')
    if (!legacySecretId || !legacySecretKey) {
      throw new Error('Tencent Translator requires `apiKey` and `options.secretId` (legacy `secretId:secretKey` is also supported).')
    }
    this.client = new tmt.v20180321.Client({
      credential: {
        secretId: legacySecretId,
        secretKey: legacySecretKey,
      },
      region,
    }) as unknown as TencentTmtClient
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    try {
      const response = await this.client.TextTranslate({
        SourceText: text,
        Source: fromLang,
        Target: toLang,
        ProjectId: 0,
      })
      if (!response.TargetText) {
        throw new TypeError('Tencent API error: No translation found in response')
      }
      return response.TargetText
    }
    catch (error: unknown) {
      throw createDriverError('Tencent', error)
    }
  }
}
