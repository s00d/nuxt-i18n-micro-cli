import axios from 'axios'
import { encodeParam, joinURL } from 'ufo'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError } from './_shared'

export class LingvaTranslateTranslator implements TranslatorDriver {
  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    const url = joinURL(
      'https://lingva.ml',
      'api/v1',
      encodeParam(fromLang),
      encodeParam(toLang),
      encodeParam(text),
    )

    try {
      const response = await axios.get(url)
      const data = response.data as unknown

      if (!data || typeof data !== 'object' || !('translation' in data) || typeof data.translation !== 'string') {
        throw createDriverTypeError('Lingva Translate', 'Invalid response')
      }

      return data.translation
    }
    catch (error: unknown) {
      throw createDriverError('Lingva Translate', error)
    }
  }
}
