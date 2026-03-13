import PapagoClient from 'papago'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError } from './_shared'

export class PapagoTranslator implements TranslatorDriver {
  private client: InstanceType<typeof PapagoClient>

  constructor(apiKey: string, options?: TranslateOptions) {
    const clientId = typeof options?.clientId === 'string' ? options.clientId : undefined
    if (clientId) {
      this.client = new PapagoClient(clientId, apiKey)
      return
    }

    const [legacyClientId, legacyClientSecret] = apiKey.split(':')
    if (!legacyClientId || !legacyClientSecret) {
      throw new Error('Papago Translator requires `apiKey` and `options.clientId` (legacy `clientId:clientSecret` is also supported).')
    }
    this.client = new PapagoClient(legacyClientId, legacyClientSecret)
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: TranslateOptions,
  ): Promise<string> {
    try {
      const result = await this.client.translate(text, fromLang, toLang) as {
        code: number | string
        text: string
      }
      if (result.code !== 0 && result.code !== '0') {
        throw new Error(result.text || `Papago error code: ${result.code}`)
      }
      if (!result.text) {
        throw createDriverTypeError('Papago', 'No translation found in response')
      }
      return result.text
    }
    catch (error: unknown) {
      throw createDriverError('Papago', error)
    }
  }
}
