import fs from 'node:fs'
import path from 'node:path'
import { parse as parseSfc } from '@vue/compiler-sfc'
import MagicString from 'magic-string'
import { parseSync, type ParserOptions } from 'oxc-parser'
import picomatch from 'picomatch'
import type { TranslationEntry, ProcessingOptions, ProcessorContext } from './types'
import { hasTemplateExpression } from './template-helpers'
import { VueProcessor } from './vue-processor'
import { flattenTranslations } from './translation-helpers'
import { KeyGenerator } from './key-generator'

function resolveLangFromFilePath(filePath: string): ParserOptions['lang'] {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.ts') {
    return 'ts'
  }
  if (ext === '.tsx') {
    return 'tsx'
  }
  if (ext === '.jsx') {
    return 'jsx'
  }
  return 'js'
}

export class FileProcessor implements ProcessorContext {
  private keyGenerator: KeyGenerator
  private translations: Map<string, string>
  private newTranslations: Map<string, TranslationEntry>
  private vueProcessor: VueProcessor
  private extractOnlyDirectories: Set<string>
  private extractOnlyIncludeMatchers: Array<(input: string) => boolean>
  private extractOnlyExcludeMatchers: Array<(input: string) => boolean>
  private baseDir?: string
  private keyOverrides: Map<string, string>
  private skippedKeys: Set<string>

  constructor(
    translations: Record<string, unknown>,
    options: ProcessingOptions = {},
  ) {
    this.translations = flattenTranslations(translations)
    this.keyGenerator = new KeyGenerator(this.translations, {
      context: options.context,
      maxLength: 40,
    })
    this.newTranslations = new Map()
    this.vueProcessor = new VueProcessor(this)
    this.extractOnlyDirectories = new Set(
      (options.extractOnlyDirectories ?? ['plugins'])
        .map(item => item.trim().toLowerCase())
        .filter(Boolean),
    )
    const rawPatterns = (options.extractOnlyPatterns ?? [])
      .map(item => item.trim())
      .filter(Boolean)
    const includePatterns = rawPatterns.filter(pattern => !pattern.startsWith('!'))
    const excludePatterns = rawPatterns
      .filter(pattern => pattern.startsWith('!'))
      .map(pattern => pattern.slice(1).trim())
      .filter(Boolean)
    this.extractOnlyIncludeMatchers = includePatterns.map(pattern => picomatch(pattern, { dot: true }))
    this.extractOnlyExcludeMatchers = excludePatterns.map(pattern => picomatch(pattern, { dot: true }))
    this.baseDir = options.baseDir
    this.keyOverrides = new Map(Object.entries(options.keyOverrides ?? {}))
    this.skippedKeys = new Set(options.skippedKeys ?? [])
  }

  processFile(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileType = path.extname(filePath)

    if (fileType === '.vue') {
      return this.processVueFile(content, filePath)
    }

    return this.processRegularFile(content, filePath)
  }

  getOrCreateTranslationKey(text: string, filePath: string, lines: string[]): string | null {
    for (const [key, value] of this.translations) {
      if (value === text) {
        return key
      }
    }

    const generatedKey = this.keyGenerator.generateKey(text, filePath)
    if (this.skippedKeys.has(generatedKey)) {
      return null
    }
    const key = this.keyOverrides.get(generatedKey) ?? generatedKey

    this.newTranslations.set(key, {
      key,
      value: text,
      file: filePath,
      line: this.findLineNumber(lines, text),
    })

    return key
  }

  private processVueFile(content: string, filePath: string): string {
    const parsed = parseSfc(content)
    const templateBlock = parsed.descriptor.template
    if (!templateBlock) {
      return content
    }

    const processedTemplate = this.vueProcessor.processTemplate(templateBlock.content, filePath)
    const relativeContentOffset = templateBlock.loc.source.indexOf(templateBlock.content)
    if (relativeContentOffset < 0) {
      return content
    }

    const start = templateBlock.loc.start.offset + relativeContentOffset
    const end = start + templateBlock.content.length
    const magic = new MagicString(content)
    magic.overwrite(start, end, processedTemplate)
    return magic.toString()
  }

  private processRegularFile(content: string, filePath: string): string {
    const lines = content.split('\n')
    const replacements: Array<{ start: number, end: number, value: string }> = []

    try {
      const parsed = parseSync(filePath, content, {
        lang: resolveLangFromFilePath(filePath),
        sourceType: 'unambiguous',
      })
      this.collectRegularFileReplacements(parsed.program as unknown, filePath, lines, replacements)
    }
    catch {
      return content
    }

    if (replacements.length === 0) {
      return content
    }

    // Plugin code can have framework-specific runtime contexts.
    // For plugins we only extract candidate strings into translations,
    // but keep source code unchanged.
    if (this.isExtractOnlyFile(filePath)) {
      return content
    }

    const magic = new MagicString(content)
    replacements
      .sort((a, b) => b.start - a.start)
      .forEach(({ start, end, value }) => {
        magic.overwrite(start, end, value)
      })

    return magic.toString()
  }

  private isExtractOnlyFile(filePath: string): boolean {
    if (this.matchesAnyPathMatcher(filePath, this.extractOnlyExcludeMatchers)) {
      return false
    }

    if (this.matchesAnyPathMatcher(filePath, this.extractOnlyIncludeMatchers)) {
      return true
    }

    const normalized = filePath
      .split(path.sep)
      .map(item => item.toLowerCase())
      .filter(Boolean)

    for (const dir of this.extractOnlyDirectories) {
      if (normalized.includes(dir)) {
        return true
      }
    }

    if (normalized.includes('plugins')) {
      return true
    }

    const filename = path.basename(filePath).toLowerCase()
    return filename.includes('plugin.')
      || filename.includes('-plugin.')
      || filename.endsWith('.plugin.ts')
      || filename.endsWith('.plugin.js')
      || filename.endsWith('.plugin.tsx')
      || filename.endsWith('.plugin.jsx')
  }

  private matchesAnyPathMatcher(filePath: string, matchers: Array<(input: string) => boolean>): boolean {
    if (matchers.length === 0) {
      return false
    }

    const normalizedAbsolute = normalizePathForMatch(filePath)
    const normalizedRelative = this.baseDir
      ? normalizePathForMatch(path.relative(this.baseDir, filePath))
      : normalizedAbsolute

    return matchers.some((isMatch) => {
      return isMatch(normalizedRelative) || isMatch(normalizedAbsolute)
    })
  }

  private collectRegularFileReplacements(
    node: unknown,
    filePath: string,
    lines: string[],
    replacements: Array<{ start: number, end: number, value: string }>,
    parent: Record<string, unknown> | null = null,
    parentKey = '',
    visited: WeakSet<object> = new WeakSet<object>(),
    ancestors: Record<string, unknown>[] = [],
  ): void {
    if (!node || typeof node !== 'object') {
      return
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        this.collectRegularFileReplacements(child, filePath, lines, replacements, parent, parentKey, visited, ancestors)
      }
      return
    }

    const current = node as Record<string, unknown>
    if (visited.has(current)) {
      return
    }
    visited.add(current)
    if (current.type === 'JSXText') {
      const jsxValue = typeof current.value === 'string' ? current.value : ''
      const trimmed = jsxValue.trim()
      if (trimmed && !hasTemplateExpression(trimmed)) {
        const range = this.getNodeRange(current)
        if (range) {
          const key = this.getOrCreateTranslationKey(trimmed, filePath, lines)
          if (key) {
            const leading = jsxValue.match(/^\s*/)?.[0] ?? ''
            const trailing = jsxValue.match(/\s*$/)?.[0] ?? ''
            replacements.push({
              start: range.start,
              end: range.end,
              value: `${leading}{ $t('${key}') }${trailing}`,
            })
          }
        }
      }
    }

    const literal = this.getStringLiteral(current)
    if (literal && this.shouldReplaceLiteral(current, literal.value, parent, parentKey, ancestors)) {
      if (!hasTemplateExpression(literal.value)) {
        const key = this.getOrCreateTranslationKey(literal.value, filePath, lines)
        if (key) {
          replacements.push({
            start: literal.start,
            end: literal.end,
            value: `"{{ $t('${key}') }}"`,
          })
        }
      }
    }

    for (const [key, value] of Object.entries(current)) {
      this.collectRegularFileReplacements(
        value,
        filePath,
        lines,
        replacements,
        current,
        key,
        visited,
        [...ancestors, current],
      )
    }
  }

  private getStringLiteral(node: Record<string, unknown>): { start: number, end: number, value: string } | null {
    const range = this.getNodeRange(node)
    const start = range?.start ?? null
    const end = range?.end ?? null
    if (start === null || end === null) {
      return null
    }

    if (node.type === 'StringLiteral' && typeof node.value === 'string') {
      return { start, end, value: node.value }
    }

    if (node.type === 'Literal' && typeof node.value === 'string') {
      return { start, end, value: node.value }
    }

    if (node.type === 'TemplateLiteral') {
      const expressions = node.expressions
      const quasis = node.quasis
      if (Array.isArray(expressions) && expressions.length === 0 && Array.isArray(quasis) && quasis.length > 0) {
        const first = quasis[0] as Record<string, unknown>
        const cooked = first && typeof first === 'object'
          ? ((first.value as Record<string, unknown> | undefined)?.cooked)
          : undefined
        if (typeof cooked === 'string') {
          return { start, end, value: cooked }
        }
      }
    }

    return null
  }

  private getNodeRange(node: Record<string, unknown>): { start: number, end: number } | null {
    if (typeof node.start === 'number' && typeof node.end === 'number') {
      return { start: node.start, end: node.end }
    }

    const loc = node.loc as Record<string, unknown> | undefined
    const locStart = loc?.start as Record<string, unknown> | undefined
    const locEnd = loc?.end as Record<string, unknown> | undefined
    const startIndex = locStart?.index
    const endIndex = locEnd?.index
    if (typeof startIndex === 'number' && typeof endIndex === 'number') {
      return { start: startIndex, end: endIndex }
    }

    return null
  }

  private shouldReplaceLiteral(
    node: Record<string, unknown>,
    literalValue: string,
    parent: Record<string, unknown> | null,
    parentKey: string,
    ancestors: Record<string, unknown>[],
  ): boolean {
    if (!parent) {
      return true
    }

    if (
      (parent.type === 'ImportDeclaration'
        || parent.type === 'ExportNamedDeclaration'
        || parent.type === 'ExportAllDeclaration')
      && parentKey === 'source'
    ) {
      return false
    }

    if (
      parent.type === 'CallExpression'
      && parentKey === 'arguments'
      && Array.isArray(parent.arguments)
      && parent.arguments[0] === node
    ) {
      const callee = parent.callee as Record<string, unknown> | undefined
      if (callee?.type === 'Identifier' && callee.name === 'require') {
        return false
      }
      if (this.isTranslationCallee(callee)) {
        return false
      }
    }

    if (
      (parent.type === 'ObjectProperty' || parent.type === 'Property')
      && parentKey === 'key'
      && parent.computed !== true
    ) {
      return false
    }

    if (parent.type === 'MemberExpression' && parentKey === 'property') {
      return false
    }

    if (
      (parent.type === 'StaticMemberExpression'
        || parent.type === 'ComputedMemberExpression'
        || parent.type === 'PrivateFieldExpression')
      && parentKey === 'property'
    ) {
      return false
    }

    if (parent.type === 'TSLiteralType') {
      return false
    }

    if (ancestors.some(item => item.type === 'TSEnumDeclaration')) {
      return false
    }

    if (
      this.isInsideConstObject(ancestors)
      && isLikelyTechnicalConstLiteral(literalValue)
    ) {
      return false
    }

    return true
  }

  private isInsideConstObject(ancestors: Record<string, unknown>[]): boolean {
    const objectIndex = findLastIndex(ancestors, node => node.type === 'ObjectExpression')
    if (objectIndex === -1) {
      return false
    }

    const declaratorIndex = findLastIndex(
      ancestors,
      (node, index) => index < objectIndex && node.type === 'VariableDeclarator',
    )
    if (declaratorIndex === -1) {
      return false
    }

    const declarationIndex = findLastIndex(
      ancestors,
      (node, index) => index < declaratorIndex
        && node.type === 'VariableDeclaration'
        && node.kind === 'const',
    )

    return declarationIndex !== -1
  }

  private isTranslationCallee(callee: Record<string, unknown> | undefined): boolean {
    if (!callee) {
      return false
    }
    if (callee.type === 'Identifier') {
      return callee.name === '$t' || callee.name === '$tc'
    }
    if (callee.type === 'MemberExpression') {
      const property = callee.property as Record<string, unknown> | undefined
      return property?.type === 'Identifier'
        && (property.name === '$t' || property.name === '$tc')
    }
    if (callee.type === 'StaticMemberExpression' || callee.type === 'ComputedMemberExpression') {
      const property = callee.property as Record<string, unknown> | undefined
      return property?.type === 'Identifier'
        && (property.name === '$t' || property.name === '$tc')
    }
    return false
  }

  private findLineNumber(lines: string[], text: string): number {
    return lines.findIndex(line => line.includes(text)) + 1
  }

  getNewTranslations(): Map<string, TranslationEntry> {
    return this.newTranslations
  }
}

function findLastIndex<T>(items: T[], predicate: (item: T, index: number) => boolean): number {
  for (let index = items.length - 1; index >= 0; index--) {
    if (predicate(items[index], index)) {
      return index
    }
  }

  return -1
}

function normalizePathForMatch(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

function isLikelyTechnicalConstLiteral(value: string): boolean {
  const normalized = value.trim()
  if (!normalized || /\s/.test(normalized)) {
    return false
  }
  if (normalized.startsWith('/') || normalized.includes('://')) {
    return true
  }
  if (/^[a-z0-9_.-]+$/.test(normalized)) {
    return true
  }
  if (/^[A-Z0-9_.-]+$/.test(normalized)) {
    return true
  }
  return false
}
