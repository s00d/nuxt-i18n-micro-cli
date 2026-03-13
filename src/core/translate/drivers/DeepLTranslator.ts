import {
  DeepLClient,
  type Formality,
  type SourceLanguageCode,
  type TargetLanguageCode,
  type TranslateTextOptions,
} from 'deepl-node'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, getNumericOption, getStringOption } from './_shared'

interface DeepLTranslateOptions extends TranslateOptions {
  formality?: Formality
  glossary_id?: string
  glossary?: string
  context?: string
  model_type?: string
  modelType?: string
  tag_handling?: string
  tagHandling?: string
}

export class DeepLTranslator implements TranslatorDriver {
  private readonly provider = 'DeepL'
  private client: DeepLClient

  constructor(apiKey: string, options?: TranslateOptions) {
    const maxRetries = getNumericOption(options, ['maxRetries', 'deeplMaxRetries'])
    const minTimeout = getNumericOption(options, ['timeoutMs', 'deeplMinTimeoutMs'])
    const serverUrl = getStringOption(options, ['deeplServerUrl'])

    this.client = new DeepLClient(apiKey, {
      maxRetries,
      minTimeout,
      serverUrl,
    })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: DeepLTranslateOptions,
  ): Promise<string> {
    const translated = await this.translateBatch([text], fromLang, toLang, options)
    return translated[0] || ''
  }

  async translateBatch(
    texts: string[],
    fromLang: string,
    toLang: string,
    options?: DeepLTranslateOptions,
  ): Promise<string[]> {
    const sourceLang = (fromLang || null) as SourceLanguageCode | null
    const targetLang = toLang as TargetLanguageCode
    const deeplOptions: TranslateTextOptions = {
      formality: options?.formality,
      glossary: options?.glossary_id || options?.glossary,
      context: typeof options?.context === 'string' ? options.context : undefined,
      modelType: (options?.modelType || options?.model_type) as TranslateTextOptions['modelType'],
      tagHandling: (options?.tagHandling || options?.tag_handling || 'xml') as TranslateTextOptions['tagHandling'],
    }

    try {
      const translated = await this.client.translateText(
        texts,
        sourceLang,
        targetLang,
        deeplOptions,
      )
      return translated.map(item => item.text)
    }
    catch (error: unknown) {
      throw createDriverError(this.provider, error)
    }
  }
}
