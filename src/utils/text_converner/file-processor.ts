import fs from 'node:fs'
import path from 'node:path'
import type { TranslationEntry, ProcessingOptions, ProcessorContext } from './types'
import { TEXT_PATTERNS, TEMPLATE_EXPRESSIONS } from './text-patterns'
import { VueProcessor } from './vue-processor'
import { flattenTranslations } from './translation-helpers'
import { KeyGenerator } from './key-generator'

export class FileProcessor implements ProcessorContext {
  private keyGenerator: KeyGenerator
  private translations: Map<string, string>
  private newTranslations: Map<string, TranslationEntry>
  private vueProcessor: VueProcessor

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
  }

  processFile(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileType = path.extname(filePath)

    if (fileType === '.vue') {
      return this.processVueFile(content, filePath)
    }

    return this.processRegularFile(content, filePath)
  }

  getOrCreateTranslationKey(text: string, filePath: string, lines: string[]): string {
    // Try to find existing translation
    for (const [key, value] of this.translations) {
      if (value === text) {
        return key
      }
    }

    // Generate new key
    const key = this.keyGenerator.generateKey(text, filePath)

    // Store new translation
    this.newTranslations.set(key, {
      key,
      value: text,
      file: filePath,
      line: this.findLineNumber(lines, text),
    })

    return key
  }

  private processVueFile(content: string, filePath: string): string {
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    if (!templateMatch) return content

    const beforeTemplate = content.slice(0, templateMatch.index)
    const afterTemplate = content.slice(templateMatch.index! + templateMatch[0].length)
    const processedTemplate = this.vueProcessor.processTemplate(templateMatch[1], filePath)

    return `${beforeTemplate}<template>${processedTemplate}</template>${afterTemplate}`
  }

  private processRegularFile(content: string, filePath: string): string {
    const lines = content.split('\n')
    let result = content

    // Process each pattern
    Object.entries(TEXT_PATTERNS).forEach(([_, pattern]) => {
      if (Array.isArray(pattern)) {
        pattern.forEach((p) => {
          result = this.processPattern(p, result, filePath, lines)
        })
      }
      else {
        result = this.processPattern(pattern, result, filePath, lines)
      }
    })

    return result
  }

  private processPattern(
    pattern: RegExp,
    content: string,
    filePath: string,
    lines: string[],
  ): string {
    return content.replace(pattern, (match, quote, text) => {
      if (!text || !this.shouldTranslate(text)) return match
      const key = this.getOrCreateTranslationKey(text, filePath, lines)
      return `${quote}{{ $t('${key}') }}${quote}`
    })
  }

  private shouldTranslate(text: string): boolean {
    return !TEMPLATE_EXPRESSIONS.CURLY_EXPRESSIONS.test(text)
  }

  private findLineNumber(lines: string[], text: string): number {
    return lines.findIndex(line => line.includes(text)) + 1
  }

  getNewTranslations(): Map<string, TranslationEntry> {
    return this.newTranslations
  }
}
