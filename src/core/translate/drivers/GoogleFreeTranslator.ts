import { translate as googleTranslate } from '@vitalets/google-translate-api'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { createDriverError, createDriverTypeError, getNumericOption } from './_shared'

interface GoogleFreeOptions extends TranslateOptions {
  host?: string
  timeout?: number
}

interface GoogleTranslateRequestOptions {
  from: string
  to: string
  host?: string
  fetchOptions?: {
    signal: AbortSignal
  }
}

export class GoogleFreeTranslator implements TranslatorDriver {
  private readonly provider = 'Google Free Translate'
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_apiKey: string, _options?: TranslateOptions) {}

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: GoogleFreeOptions,
  ): Promise<string> {
    const timeout = getNumericOption(options, ['timeoutMs', 'timeout'])
    const timeoutSignal = typeof timeout === 'number'
      && typeof AbortSignal !== 'undefined'
      && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(timeout)
      : undefined
    const fetchOptions = timeoutSignal ? { signal: timeoutSignal } : undefined

    const requestOptions: GoogleTranslateRequestOptions = {
      from: fromLang || 'auto',
      to: toLang,
      host: options?.host,
      fetchOptions,
    }

    try {
      const { text: translatedText } = await googleTranslate(text, requestOptions)
      if (typeof translatedText !== 'string') {
        throw createDriverTypeError(this.provider, 'Empty response')
      }
      return translatedText
    }
    catch (error: unknown) {
      throw createDriverError(this.provider, error)
    }
  }
}
