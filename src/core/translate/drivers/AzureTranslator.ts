import TextTranslationClient, { isUnexpected } from '@azure-rest/ai-translation-text'
import { AzureKeyCredential } from '@azure/core-auth'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getStringOption } from './_shared'

export class AzureTranslator implements TranslatorDriver {
  private client: ReturnType<typeof TextTranslationClient>

  constructor(apiKey: string, options?: TranslateOptions) {
    const endpoint = getStringOption(options, ['endpoint', 'azureEndpoint']) ?? 'https://api.cognitive.microsofttranslator.com'
    const region = getStringOption(options, ['region', 'azureRegion'])
    const credential: { key: string, region: string } | AzureKeyCredential = region
      ? { key: apiKey, region }
      : new AzureKeyCredential(apiKey)
    this.client = TextTranslationClient(endpoint, credential)
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    try {
      const response = await this.client.path('/translate').post({
        body: [{ text }],
        queryParameters: {
          to: toLang,
          from: fromLang || undefined,
        },
      })
      if (isUnexpected(response)) {
        throw response.body
      }
      const translatedText = response.body[0]?.translations?.[0]?.text
      if (!translatedText) {
        throw createDriverTypeError('Azure Translator', 'No translation found in response')
      }
      return translatedText
    }
    catch (error: unknown) {
      throw createDriverError('Azure Translator', error)
    }
  }
}
