import OpenAI from 'openai'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { buildNeuralTranslationSystemPrompt, createDriverError, createDriverTypeError, getNumericOption } from './_shared'

interface OpenAITranslateOptions extends TranslateOptions {
  openaiModel?: string
  max_tokens?: number
  temperature?: number
  top_p?: number
  n?: number
  stop?: string | string[]
}

export class OpenAITranslator implements TranslatorDriver {
  private readonly provider = 'OpenAI'
  private client: OpenAI

  constructor(apiKey: string, options?: TranslateOptions) {
    const maxRetries = getNumericOption(options, ['maxRetries', 'openaiMaxRetries'])
    const timeout = getNumericOption(options, ['timeoutMs', 'openaiTimeoutMs'])

    this.client = new OpenAI({
      apiKey,
      maxRetries,
      timeout,
    })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: OpenAITranslateOptions,
  ): Promise<string> {
    const model = options?.openaiModel || 'gpt-3.5-turbo'
    const maxTokens = options?.max_tokens ?? 1000
    const temperature = options?.temperature ?? 0.3

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: buildNeuralTranslationSystemPrompt(fromLang, toLang, options),
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: options?.top_p,
        n: options?.n,
        stop: options?.stop,
      })

      const content = completion.choices[0]?.message?.content
      if (!content || typeof content !== 'string') {
        throw createDriverTypeError(this.provider, 'Empty response content')
      }
      return content.trim()
    }
    catch (error: unknown) {
      throw createDriverError(this.provider, error)
    }
  }
}
