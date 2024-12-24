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
    // Initialize used keys from existing translations
    for (const key of existingTranslations.keys()) {
      this.usedKeys.add(key)
    }
  }

  generateKey(text: string, filePath: string): string {
    const maxLength = this.options.maxLength || 40

    const filePrefix = this.getFilePrefix(filePath)

    // Extract meaningful words
    const keywords = extractKeywords(text)

    // Create base key
    let baseKey = keywords.length > 0
      ? keywords.join('_')
      : truncateText(text, maxLength)

    // Convert to slug
    baseKey = toSlug(baseKey)

    if (!baseKey) {
      baseKey = `key_${this.autoIncrementIndex++}`
    }

    // Add context prefix if provided
    if (this.options.context) {
      baseKey = `${this.options.context}.${baseKey}`
    }

    // Ensure key is unique
    let finalKey = `${filePrefix}.${baseKey}`
    let counter = 1

    while (this.usedKeys.has(finalKey)) {
      finalKey = `${baseKey}_${counter}`
      counter++
    }

    // Register the new key
    this.usedKeys.add(finalKey)

    return finalKey
  }

  private getFilePrefix(filePath: string): string {
    // Remove extension and convert to path segments
    const parsed = path.parse(filePath)
    const segments = parsed.dir.split('/')

    // Find the base directory (pages, components, plugins)
    const baseDir = segments.find(s => ['pages', 'components', 'plugins', 'layouts'].includes(s))
    if (!baseDir) return 'common'

    // Get the path after the base directory
    const startIndex = segments.indexOf(baseDir)
    const remainingPath = segments
      .slice(startIndex + 1)
      .concat(parsed.name)
      .map(part => toSlug(part))
      .join('.')

    // Always add a dot after baseDir, even if remainingPath is empty
    return toSlug(`${baseDir}`) + '.' + remainingPath
  }
}
