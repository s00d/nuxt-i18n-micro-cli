import { TEMPLATE_EXPRESSIONS } from './text-patterns'
import { isTranslatableText } from './template-helpers'
import type { ProcessorContext } from './types'

export class VueProcessor {
  constructor(private context: ProcessorContext) {}

  processTemplate(template: string, filePath: string): string {
    const lines = template.split('\n')
    let result = template

    // Process text content between tags while preserving HTML structure
    result = this.processTextNodes(result, filePath, lines)

    // Process attributes
    result = this.processAttributes(result, filePath, lines)

    return result
  }

  private processTextNodes(content: string, filePath: string, lines: string[]): string {
    return content.replace(
      />([\s\S]*?)</g,
      (match, text) => {
        const trimmed = text.trim()
        if (!trimmed || !isTranslatableText(trimmed)) {
          return match
        }

        // Skip if already contains translations or special functions
        if (this.hasSpecialExpressions(trimmed)) {
          return match
        }

        const key = this.context.getOrCreateTranslationKey(trimmed, filePath, lines)
        return `>{{ $t('${key}') }}<`
      },
    )
  }

  private processAttributes(content: string, filePath: string, lines: string[]): string {
    return content.replace(
      /\b(title|label|placeholder|alt)=(['"])(.*?)\2/g,
      (match, attr, quote, text) => {
        if (match.startsWith(':') || !isTranslatableText(text)) {
          return match
        }

        // Skip if already contains translations or special functions
        if (this.hasSpecialExpressions(text)) {
          return match
        }

        const key = this.context.getOrCreateTranslationKey(text, filePath, lines)
        return `:${attr}="$t('${key}')"`
      },
    )
  }

  private hasSpecialExpressions(text: string): boolean {
    return (
      TEMPLATE_EXPRESSIONS.TRANSLATION.test(text)
      || TEMPLATE_EXPRESSIONS.SPECIAL_FUNCTIONS.test(text)
    )
  }
}
