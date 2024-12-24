import { TEMPLATE_EXPRESSIONS } from './text-patterns'

/**
 * Checks if text contains any template expressions
 */
export function hasTemplateExpression(text: string): boolean {
  return TEMPLATE_EXPRESSIONS.CURLY_EXPRESSIONS.test(text)
}

/**
 * Checks if text is a standalone translatable string
 * Returns false if text contains any template expressions
 */
export function isTranslatableText(text: string): boolean {
  return !hasTemplateExpression(text) && text.trim().length > 0
}
