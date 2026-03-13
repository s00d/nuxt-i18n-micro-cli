import { ModernMT } from 'modernmt'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

export class ModernMTTranslator implements TranslatorDriver {
  private client: ModernMT

  constructor(apiKey: string, options?: TranslateOptions) {
    if (!apiKey) {
      throw new Error('ModernMT Translator requires an apiKey.')
    }
    this.client = new ModernMT(
      apiKey,
      getStringOption(options, ['platform', 'clientName']) ?? 'nuxt-i18n-micro-cli',
      getStringOption(options, ['platformVersion', 'clientVersion']) ?? '1.0.0',
    )
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    try {
      const contextVector = getStringOption(options, ['contextVector', 'context'])
      const translated = await this.client.translate(fromLang, toLang, text, undefined, contextVector)
      const value = Array.isArray(translated) ? translated[0]?.translation : translated.translation
      if (!value) {
        throw createDriverTypeError('ModernMT', 'No translation found in response')
      }
      return value
    }
    catch (error: unknown) {
      throw createDriverError('ModernMT', error)
    }
  }
}
