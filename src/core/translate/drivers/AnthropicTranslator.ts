import Anthropic from '@anthropic-ai/sdk'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { buildNeuralTranslationSystemPrompt, createDriverError, createDriverTypeError, getNumericOption, getStringOption } from './_shared'

interface AnthropicTranslateOptions extends TranslateOptions {
  anthropicModel?: string
  max_tokens?: number
  temperature?: number
}

export class AnthropicTranslator implements TranslatorDriver {
  private readonly provider = 'Anthropic'
  private client: Anthropic

  constructor(apiKey: string, options?: TranslateOptions) {
    this.client = new Anthropic({
      apiKey,
      maxRetries: getNumericOption(options, ['maxRetries', 'anthropicMaxRetries']),
      timeout: getNumericOption(options, ['timeoutMs', 'anthropicTimeoutMs']),
    })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: AnthropicTranslateOptions,
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: options?.anthropicModel ?? getStringOption(options, ['model']) ?? 'claude-3-5-sonnet-latest',
        max_tokens: options?.max_tokens ?? 1024,
        temperature: typeof options?.temperature === 'number' ? options.temperature : 0.2,
        system: buildNeuralTranslationSystemPrompt(fromLang, toLang, options),
        messages: [{ role: 'user', content: text }],
      })

      const translated = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
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
