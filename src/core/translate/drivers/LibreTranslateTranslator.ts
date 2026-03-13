import { libreTranslate } from 'libretranslate-ts'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError } from './_shared'

export class LibreTranslateTranslator implements TranslatorDriver {
  private baseUrl: string
  private apiKey?: string

  constructor(apiKey: string, options?: TranslateOptions) {
    this.apiKey = apiKey
    this.baseUrl = typeof options?.baseUrl === 'string' ? options.baseUrl : 'https://libretranslate.com'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    try {
      libreTranslate.setApiEndpoint(this.baseUrl)
      if (this.apiKey) {
        libreTranslate.setApiKey(this.apiKey)
      }
      const response = await libreTranslate.translate(text, fromLang, toLang)
      if (response.error) {
        throw new Error(response.error)
      }
      if (!response.translatedText) {
        throw createDriverTypeError('LibreTranslate', 'Invalid response')
      }
      return response.translatedText
    }
    catch (error: unknown) {
      throw createDriverError('LibreTranslate', error)
    }
  }
}
