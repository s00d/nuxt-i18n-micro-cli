import type { TranslateOptions } from '../drivers/TranslatorDriver'
import { getStringOption } from '../drivers/_shared'

export function buildTranslationSystemPrompt(
  fromLang: string,
  toLang: string,
  options?: TranslateOptions,
): string {
  const lines = [
    `You are a professional localizer translating software UI text from ${fromLang} to ${toLang}.`,
    'CRITICAL RULES:',
    '1. DO NOT translate or modify placeholders wrapped in curly braces (e.g., {name}, %{count}, {{value}}).',
    '2. DO NOT translate or modify linked i18n references starting with @: (e.g., @:common.save).',
    '3. Preserve all HTML/XML tags exactly as-is.',
    '4. If the text contains "|" plural separators, keep the same separators and translate each plural segment naturally.',
    '5. Return ONLY the translated text in the structured "translation" field, without explanations or quotes.',
  ]

  const context = getStringOption(options, ['translationContext', 'context', 'batchContext'])
  if (context) {
    lines.push(`CONTEXT: ${context}`)
  }

  const glossaryContext = getStringOption(options, ['glossaryContext'])
  if (glossaryContext) {
    lines.push('GLOSSARY (must follow exactly when terms appear):')
    lines.push(glossaryContext)
  }

  return lines.join('\n')
}
