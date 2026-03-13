import type { TranslationEntry } from './types'

export interface NestedTranslations {
  [key: string]: string | NestedTranslations
}

export function mergeTranslations(
  existing: NestedTranslations,
  newTranslations: Map<string, TranslationEntry>,
): NestedTranslations {
  const result = { ...existing }

  for (const [key, entry] of newTranslations) {
    const parts = key.split('.')
    let current = result

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part] as NestedTranslations
    }

    current[parts[parts.length - 1]] = entry.value
  }

  return result
}
