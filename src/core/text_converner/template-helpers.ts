import { TEMPLATE_EXPRESSIONS } from './text-patterns'

export function hasTemplateExpression(text: string): boolean {
  return TEMPLATE_EXPRESSIONS.CURLY_EXPRESSIONS.test(text)
}

export function isTranslatableText(text: string): boolean {
  return !hasTemplateExpression(text) && text.trim().length > 0
}
