import { Mistral } from '@mistralai/mistralai'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { buildNeuralTranslationSystemPrompt, createDriverError, createDriverTypeError, getNumericOption, getStringOption } from './_shared'

interface MistralTranslateOptions extends TranslateOptions {
  mistralModel?: string
  max_tokens?: number
  temperature?: number
}

export class MistralTranslator implements TranslatorDriver {
  private readonly provider = 'Mistral'
  private client: Mistral

  constructor(apiKey: string, options?: TranslateOptions) {
    this.client = new Mistral({
      apiKey,
      timeoutMs: getNumericOption(options, ['timeoutMs', 'mistralTimeoutMs']),
    })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: MistralTranslateOptions,
  ): Promise<string> {
    try {
      const response = await this.client.chat.complete({
        model: options?.mistralModel ?? getStringOption(options, ['model']) ?? 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: buildNeuralTranslationSystemPrompt(fromLang, toLang, options),
          },
          { role: 'user', content: text },
        ],
        maxTokens: options?.max_tokens ?? 1024,
        temperature: typeof options?.temperature === 'number' ? options.temperature : 0.2,
      })

      const content = response.choices[0]?.message.content
      const translated = typeof content === 'string'
        ? content.trim()
        : Array.isArray(content)
          ? content
              .map(part => ('text' in part && typeof part.text === 'string') ? part.text : '')
              .join('\n')
              .trim()
          : ''

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
