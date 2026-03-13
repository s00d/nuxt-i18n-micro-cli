import { isJsonObject, type JsonObject, type JsonValue, type TranslationSetData } from './types'
import {
  flattenTranslations as flattenJsonTranslations,
  getNestedValue as getNestedJsonValue,
  setNestedValue as setNestedJsonValue,
} from './utils/json'

function cloneObject<T extends JsonObject>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function retainOnlyKeys(
  translations: JsonObject,
  usedKeys: Set<string>,
  shouldKeepKey?: (fullPath: string) => boolean,
  currentPath: string[] = [],
): JsonObject {
  const cleaned: JsonObject = {}

  for (const [key, value] of Object.entries(translations)) {
    const fullPath = [...currentPath, key]
    const fullPathStr = fullPath.join('.')

    if (shouldKeepKey && !shouldKeepKey(fullPathStr)) {
      continue
    }

    const isUsed = Array.from(usedKeys).some(usedKey => usedKey === fullPathStr || usedKey.startsWith(`${fullPathStr}.`))
    if (!isUsed && !isJsonObject(value)) {
      continue
    }

    if (isJsonObject(value)) {
      const nested = retainOnlyKeys(value, usedKeys, shouldKeepKey, fullPath)
      if (Object.keys(nested).length > 0) {
        cleaned[key] = nested
      }
      continue
    }

    if (value !== null && value !== undefined) {
      cleaned[key] = value
    }
  }

  return cleaned
}

export class TranslationSet {
  public global: JsonObject
  public pages: Record<string, JsonObject>
  public isModified = false

  constructor(data?: Partial<TranslationSetData>) {
    this.global = cloneObject(data?.global ?? {})
    this.pages = cloneObject(data?.pages ?? {})
  }

  static fromData(data: TranslationSetData): TranslationSet {
    return new TranslationSet(data)
  }

  toData(): TranslationSetData {
    return {
      global: cloneObject(this.global),
      pages: cloneObject(this.pages),
    }
  }

  getPageScopes(): string[] {
    return Object.keys(this.pages)
  }

  getValue(keyPath: string, scope: 'global' | string = 'global'): JsonValue | undefined {
    if (scope === 'global') {
      return getNestedJsonValue(this.global, keyPath) as JsonValue | undefined
    }

    const pageTranslations = this.pages[scope]
    if (!pageTranslations) {
      return undefined
    }
    return getNestedJsonValue(pageTranslations, keyPath) as JsonValue | undefined
  }

  setValue(keyPath: string, value: JsonValue, scope: 'global' | string = 'global'): void {
    if (scope === 'global') {
      setNestedJsonValue(this.global, keyPath, value)
      this.isModified = true
      return
    }

    if (!this.pages[scope]) {
      this.pages[scope] = {}
    }
    setNestedJsonValue(this.pages[scope], keyPath, value)
    this.isModified = true
  }

  getFlatGlobalKeys(): Record<string, string> {
    return flattenJsonTranslations(this.global)
  }

  getFlatPageKeys(pageScope: string): Record<string, string> {
    return flattenJsonTranslations(this.pages[pageScope] ?? {})
  }

  retainOnlyGlobal(usedKeys: Set<string>, shouldKeepKey?: (fullPath: string) => boolean): void {
    this.global = retainOnlyKeys(this.global, usedKeys, shouldKeepKey)
    this.isModified = true
  }

  retainOnlyPage(pageScope: string, usedKeys: Set<string>, shouldKeepKey?: (fullPath: string) => boolean): void {
    const pageTranslations = this.pages[pageScope]
    if (!pageTranslations) {
      return
    }

    const cleaned = retainOnlyKeys(pageTranslations, usedKeys, shouldKeepKey)
    if (Object.keys(cleaned).length > 0) {
      this.pages[pageScope] = cleaned
    }
    else {
      this.pages = Object.fromEntries(
        Object.entries(this.pages).filter(([scope]) => scope !== pageScope),
      )
    }
    this.isModified = true
  }
}
