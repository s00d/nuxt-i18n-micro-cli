import * as LiltSdk from 'lilt-node'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getNumericOption, getStringOption } from './_shared'

interface LiltApiClientAuth {
  username?: string
  password?: string
}

interface LiltApiClientApiKeyAuth {
  apiKey?: string
}

interface LiltApiClient {
  basePath: string
  authentications: {
    BasicAuth: LiltApiClientAuth
    ApiKeyAuth: LiltApiClientApiKeyAuth
  }
}

interface LiltTranslateApi {
  translateSegmentPost(options: {
    body: {
      source: string
      source_lang: string
      target_lang: string
      memory_id: number
    }
  }): Promise<{
    translation?: Array<{ target?: string }>
  }>
}

export class LiltTranslator implements TranslatorDriver {
  private client: LiltTranslateApi

  constructor(apiKey: string, options?: TranslateOptions) {
    if (!apiKey) {
      throw new Error('Lilt Translator requires an apiKey.')
    }
    const sdk = LiltSdk as unknown as {
      ApiClient: new () => LiltApiClient
      TranslateApi: new (client: LiltApiClient) => LiltTranslateApi
    }
    const apiClient = new sdk.ApiClient()
    const baseUrl = getStringOption(options, ['baseUrl']) ?? 'https://api.lilt.com'
    apiClient.basePath = baseUrl.replace(/\/+$/, '')
    apiClient.authentications.BasicAuth.username = apiKey
    apiClient.authentications.BasicAuth.password = apiKey
    apiClient.authentications.ApiKeyAuth.apiKey = apiKey
    this.client = new sdk.TranslateApi(apiClient)
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    try {
      const memoryId = getNumericOption(options, ['memory_id', 'memoryId']) ?? 0
      const response = await this.client.translateSegmentPost({
        body: {
          source: text,
          source_lang: fromLang,
          target_lang: toLang,
          memory_id: memoryId,
        },
      })
      const translated = response?.translation?.[0]?.target
      if (!translated || typeof translated !== 'string') {
        throw createDriverTypeError('Lilt', 'No translation found in response')
      }
      return translated
    }
    catch (error: unknown) {
      throw createDriverError('Lilt', error)
    }
  }
}
