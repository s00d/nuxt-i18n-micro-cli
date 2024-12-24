/**
 * Handles translation structure transformation between nested and flat formats
 */
import type { TranslationEntry } from './types'

export interface NestedTranslations {
  [key: string]: string | NestedTranslations
}

export function flatToNested(translations: Map<string, string>): NestedTranslations {
  const result: NestedTranslations = {}

  for (const [key, value] of translations) {
    const parts = key.split('.')
    let current = result

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part] as NestedTranslations
    }

    current[parts[parts.length - 1]] = value
  }

  return result
}

export function nestedToFlat(
  obj: NestedTranslations,
  prefix = '',
): Map<string, string> {
  const result = new Map<string, string>()

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      result.set(newKey, value)
    }
    else {
      const nested = nestedToFlat(value, newKey)
      for (const [nestedKey, nestedValue] of nested) {
        result.set(nestedKey, nestedValue)
      }
    }
  }

  return result
}

export function mergeTranslations(
  existing: NestedTranslations,
  newTranslations: Map<string, TranslationEntry>,
): NestedTranslations {
  const result = { ...existing }

  for (const [key, entry] of newTranslations) {
    const parts = key.split('.')
    let current = result

    // Create nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part] as NestedTranslations
    }

    // Set the value
    current[parts[parts.length - 1]] = entry.value
  }

  return result
}
