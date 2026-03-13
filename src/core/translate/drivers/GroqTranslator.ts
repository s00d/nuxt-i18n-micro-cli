import Groq from 'groq-sdk'
import type { TranslateOptions, TranslatorDriver } from './TranslatorDriver'
import { buildNeuralTranslationSystemPrompt, createDriverError, createDriverTypeError, getNumericOption, getStringOption } from './_shared'

interface GroqTranslateOptions extends TranslateOptions {
  groqModel?: string
  max_tokens?: number
  temperature?: number
  top_p?: number
}

export class GroqTranslator implements TranslatorDriver {
  private readonly provider = 'Groq'
  private client: Groq

  constructor(apiKey: string, options?: TranslateOptions) {
    this.client = new Groq({
      apiKey,
      maxRetries: getNumericOption(options, ['maxRetries', 'groqMaxRetries']),
      timeout: getNumericOption(options, ['timeoutMs', 'groqTimeoutMs']),
    })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: GroqTranslateOptions,
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: options?.groqModel ?? getStringOption(options, ['model']) ?? 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: buildNeuralTranslationSystemPrompt(fromLang, toLang, options),
          },
          { role: 'user', content: text },
        ],
        max_tokens: options?.max_tokens ?? 1024,
        temperature: typeof options?.temperature === 'number' ? options.temperature : 0.2,
        top_p: options?.top_p,
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
