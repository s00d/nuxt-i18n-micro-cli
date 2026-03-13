import { Session, cloudApi, serviceClients } from '@yandex-cloud/nodejs-sdk'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

interface YandexTranslateClient {
  translate(request: unknown): Promise<{ translations?: Array<{ text?: string }> }>
}

export class YandexCloudTranslator implements TranslatorDriver {
  private client: YandexTranslateClient
  private folderId: string

  constructor(apiKey: string, options?: TranslateOptions) {
    this.folderId = typeof options?.folderId === 'string' ? options.folderId : ''
    if (!this.folderId) {
      throw new Error('Yandex Cloud Translator requires folderId in options.')
    }
    this.client = new Session({ iamToken: apiKey })
      .client(serviceClients.TranslationServiceClient) as unknown as YandexTranslateClient
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    try {
      const request = cloudApi.ai.translate_translation_service.TranslateRequest.fromPartial({
        folderId: this.folderId,
        texts: [text],
        sourceLanguageCode: fromLang,
        targetLanguageCode: toLang,
        format: cloudApi.ai.translate_translation_service.TranslateRequest_Format.HTML,
        model: getStringOption(options, ['model']),
      })
      const response = await this.client.translate(request)
      const translated = response.translations?.[0]?.text
      if (!translated) {
        throw createDriverTypeError('Yandex Cloud Translate', 'No translation found in response')
      }
      return translated
    }
    catch (error: unknown) {
      throw createDriverError('Yandex Cloud Translate', error)
    }
  }
}
