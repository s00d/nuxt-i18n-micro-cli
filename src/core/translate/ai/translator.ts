import { consola } from 'consola'
import { generateText, Output } from 'ai'
import type { TranslateOptions, TranslatorDriver } from '../drivers/TranslatorDriver'
import { createDriverError, createDriverTypeError } from '../drivers/_shared'
import {
  resolveAiApiKey,
  resolveAiTranslationConfig,
  translationOutputSchema,
} from './config'
import { resolveLanguageModel } from './provider-loader'
import { buildTranslationSystemPrompt } from './prompts'

export class AiTranslator implements TranslatorDriver {
  constructor(private readonly apiKey: string) {}

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: TranslateOptions,
  ): Promise<string> {
    const config = resolveAiTranslationConfig(options)
    const apiKey = resolveAiApiKey(config.provider, this.apiKey)

    try {
      const model = await resolveLanguageModel(config.provider, config.model, apiKey, options)
      const result = await generateText({
        model,
        system: buildTranslationSystemPrompt(fromLang, toLang, options),
        prompt: text,
        output: Output.object({
          schema: translationOutputSchema,
          description: 'Localized UI string translation',
        }),
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
        topP: config.topP,
      })

      const translated = result.output?.translation?.trim()
      if (translated) {
        return translated
      }

      const fallback = result.text.trim()
      if (fallback) {
        consola.debug('AI translation fell back to plain text output')
        return fallback
      }

      throw createDriverTypeError('AI', 'Empty response content')
    }
    catch (error: unknown) {
      throw createDriverError('AI', error)
    }
  }
}
