import axios from 'axios'
import { joinURL, withQuery, withoutTrailingSlash } from 'ufo'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

export class IBMTranslator implements TranslatorDriver {
  private apiKey: string
  private url: string
  private version: string

  constructor(apiKey: string, options?: TranslateOptions) {
    this.apiKey = apiKey
    this.url = getStringOption(options, ['url', 'serviceUrl', 'ibmUrl']) ?? 'https://api.us-south.language-translator.watson.cloud.ibm.com/instances/your-instance-id'
    this.version = getStringOption(options, ['version', 'ibmVersion']) ?? '2018-05-01'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    try {
      const endpoint = withQuery(
        joinURL(withoutTrailingSlash(this.url), 'v3/translate'),
        { version: this.version },
      )
      const response = await axios.post<{ translations?: Array<{ translation?: string }> }>(
        endpoint,
        {
          text: [text],
          model_id: `${fromLang}-${toLang}`,
        },
        {
          auth: {
            username: 'apikey',
            password: this.apiKey,
          },
        },
      )
      const translated = response.data.translations?.[0]?.translation
      if (!translated) {
        throw createDriverTypeError('IBM Watson', 'No translation found in response')
      }
      return translated
    }
    catch (error: unknown) {
      throw createDriverError('IBM Watson', error)
    }
  }
}
