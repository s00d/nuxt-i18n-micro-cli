import { CohereClientV2 } from 'cohere-ai'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { buildNeuralTranslationSystemPrompt, createDriverError, createDriverTypeError, getNumericOption, getStringOption } from './_shared'

interface CohereTranslateOptions extends TranslateOptions {
  cohereModel?: string
  temperature?: number
  max_tokens?: number
}

export class CohereTranslator implements TranslatorDriver {
  private readonly provider = 'Cohere'
  private client: CohereClientV2

  constructor(apiKey: string, options?: TranslateOptions) {
    this.client = new CohereClientV2({
      token: apiKey,
      timeoutInSeconds: toTimeoutInSeconds(getNumericOption(options, ['timeoutMs', 'cohereTimeoutMs'])),
    })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: CohereTranslateOptions,
  ): Promise<string> {
    try {
      const response = await this.client.chat({
        model: options?.cohereModel ?? getStringOption(options, ['model']) ?? 'command-a-03-2025',
        messages: [
          {
            role: 'system',
            content: buildNeuralTranslationSystemPrompt(fromLang, toLang, options),
          },
          { role: 'user', content: text },
        ],
        temperature: typeof options?.temperature === 'number' ? options.temperature : 0.2,
        maxTokens: options?.max_tokens ?? 1024,
      })

      const translated = (response.message.content ?? [])
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n')
        .trim()

      if (!translated) {
        throw createDriverTypeError(this.provider, 'Empty response content')
      }

      return translated
    }
    catch (error: unknown) {
      throw createDriverError(this.provider, error)
    }
  }
}

function toTimeoutInSeconds(timeoutMs?: number): number | undefined {
  if (typeof timeoutMs !== 'number' || Number.isNaN(timeoutMs) || timeoutMs <= 0) {
    return undefined
  }

  return Math.ceil(timeoutMs / 1000)
}
