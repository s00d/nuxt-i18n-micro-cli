import { NodeTypes, baseParse } from '@vue/compiler-dom'
import MagicString from 'magic-string'
import { TEMPLATE_EXPRESSIONS } from './text-patterns'
import { isTranslatableText } from './template-helpers'
import type { ProcessorContext } from './types'

export class VueProcessor {
  constructor(private context: ProcessorContext) {}

  processTemplate(template: string, filePath: string): string {
    const lines = template.split('\n')
    const ast = baseParse(template, { comments: true })
    const magic = new MagicString(template)
    const replacements: Array<{ start: number, end: number, value: string }> = []

    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') {
        return
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          walk(item)
        }
        return
      }

      const current = node as Record<string, unknown>
      const type = current.type

      if (type === NodeTypes.TEXT) {
        this.collectTextReplacement(current, filePath, lines, replacements)
      }
      else if (type === NodeTypes.ATTRIBUTE) {
        this.collectAttributeReplacement(current, filePath, lines, replacements)
      }

      for (const value of Object.values(current)) {
        walk(value)
      }
    }

    walk(ast)

    replacements
      .sort((a, b) => b.start - a.start)
      .forEach(({ start, end, value }) => {
        magic.overwrite(start, end, value)
      })

    return magic.toString()
  }

  private collectTextReplacement(
    node: Record<string, unknown>,
    filePath: string,
    lines: string[],
    replacements: Array<{ start: number, end: number, value: string }>,
  ): void {
    const source = this.getNestedString(node, ['loc', 'source'])
    const start = this.getNestedNumber(node, ['loc', 'start', 'offset'])
    const end = this.getNestedNumber(node, ['loc', 'end', 'offset'])

    if (!source || start === null || end === null) {
      return
    }

    const trimmed = source.trim()
    if (!trimmed || !isTranslatableText(trimmed) || this.hasSpecialExpressions(trimmed)) {
      return
    }

    const key = this.context.getOrCreateTranslationKey(trimmed, filePath, lines)
    if (!key) {
      return
    }
    const leading = source.match(/^\s*/)?.[0] ?? ''
    const trailing = source.match(/\s*$/)?.[0] ?? ''
    replacements.push({
      start,
      end,
      value: `${leading}{{ $t('${key}') }}${trailing}`,
    })
  }

  private collectAttributeReplacement(
    node: Record<string, unknown>,
    filePath: string,
    lines: string[],
    replacements: Array<{ start: number, end: number, value: string }>,
  ): void {
    const name = node.name
    if (typeof name !== 'string' || !['title', 'label', 'placeholder', 'alt'].includes(name)) {
      return
    }

    const valueSource = this.getNestedString(node, ['value', 'content'])
    const start = this.getNestedNumber(node, ['loc', 'start', 'offset'])
    const end = this.getNestedNumber(node, ['loc', 'end', 'offset'])

    if (!valueSource || start === null || end === null) {
      return
    }

    if (!isTranslatableText(valueSource) || this.hasSpecialExpressions(valueSource)) {
      return
    }

    const key = this.context.getOrCreateTranslationKey(valueSource, filePath, lines)
    if (!key) {
      return
    }
    replacements.push({
      start,
      end,
      value: `:${name}="$t('${key}')"`,
    })
  }

  private hasSpecialExpressions(text: string): boolean {
    return (
      TEMPLATE_EXPRESSIONS.TRANSLATION.test(text)
      || TEMPLATE_EXPRESSIONS.SPECIAL_FUNCTIONS.test(text)
    )
  }

  private getNestedString(source: Record<string, unknown>, path: string[]): string | null {
    let current: unknown = source
    for (const segment of path) {
      if (!current || typeof current !== 'object') {
        return null
      }
      current = (current as Record<string, unknown>)[segment]
    }
    return typeof current === 'string' ? current : null
  }

  private getNestedNumber(source: Record<string, unknown>, path: string[]): number | null {
    let current: unknown = source
    for (const segment of path) {
      if (!current || typeof current !== 'object') {
        return null
      }
      current = (current as Record<string, unknown>)[segment]
    }
    return typeof current === 'number' ? current : null
  }
}
