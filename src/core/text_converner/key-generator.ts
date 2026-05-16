import path from 'node:path'
import { toSlug, extractKeywords, truncateText } from './translation-helpers'

interface KeyGeneratorOptions {
  maxLength?: number
  context?: string
}

export class KeyGenerator {
  private usedKeys = new Set<string>()
  private autoIncrementIndex = 1

  constructor(
    existingTranslations: Map<string, string>,
    private options: KeyGeneratorOptions = {},
  ) {
    for (const key of existingTranslations.keys()) {
      this.usedKeys.add(key)
    }
  }

  generateKey(text: string, filePath: string): string {
    const maxLength = this.options.maxLength || 40

    const filePrefix = this.getFilePrefix(filePath)
    const keywords = extractKeywords(text)

    let baseKey = keywords.length > 0
      ? keywords.join('_')
      : truncateText(text, maxLength)

    baseKey = toSlug(baseKey)

    if (!baseKey) {
      baseKey = `key_${this.autoIncrementIndex++}`
    }

    if (this.options.context) {
      baseKey = `${this.options.context}.${baseKey}`
    }

    let finalKey = `${filePrefix}.${baseKey}`
    let counter = 1

    while (this.usedKeys.has(finalKey)) {
      finalKey = `${filePrefix}.${baseKey}_${counter}`
      counter++
    }

    this.usedKeys.add(finalKey)

    return finalKey
  }

  private getFilePrefix(filePath: string): string {
    const parsed = path.parse(filePath)
    const segments = parsed.dir.split('/')

    const knownRoots = ['pages', 'components', 'plugins', 'layouts'] as const
    const appIndex = segments.indexOf('app')
    const rootAfterApp = appIndex >= 0 ? segments[appIndex + 1] : undefined
    const baseDir
      = rootAfterApp && (knownRoots as readonly string[]).includes(rootAfterApp)
        ? rootAfterApp
        : segments.find(s => (knownRoots as readonly string[]).includes(s))

    if (!baseDir) return 'common'

    const startIndex
      = rootAfterApp === baseDir && appIndex >= 0 ? appIndex + 2 : segments.indexOf(baseDir) + 1
    const remainingPath = segments
      .slice(startIndex)
      .concat(parsed.name)
      .map(part => toSlug(part))
      .join('.')

    return `${toSlug(baseDir)}.${remainingPath}`
  }
}
