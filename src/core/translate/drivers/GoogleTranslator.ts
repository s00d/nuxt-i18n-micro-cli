import { v2 as GoogleTranslateV2 } from '@google-cloud/translate'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

export class GoogleTranslator implements TranslatorDriver {
  private client: GoogleTranslateV2.Translate

  constructor(apiKey: string, options?: TranslateOptions) {
    this.client = new GoogleTranslateV2.Translate({
      key: apiKey,
      projectId: getStringOption(options, ['projectId', 'googleProjectId']),
      apiEndpoint: getStringOption(options, ['apiEndpoint', 'googleApiEndpoint']),
    })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: {
      format?: string
      model?: string
      glossaryConfig?: Record<string, unknown>
    },
  ): Promise<string> {
    const translated = await this.translateBatch([text], fromLang, toLang, options)
    return translated[0] || ''
  }

  async translateBatch(
    texts: string[],
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string[]> {
    try {
      const [translated] = await this.client.translate(texts, {
        to: toLang,
        from: fromLang || undefined,
        format: getStringOption(options, ['format']) ?? 'html',
        model: getStringOption(options, ['model']),
      })

      if (Array.isArray(translated)) {
        return translated
      }
      if (typeof translated === 'string') {
        return [translated]
      }
      throw createDriverTypeError('Google Translate', 'Invalid response format')
    }
    catch (error: unknown) {
      throw createDriverError('Google Translate', error)
    }
  }
}
