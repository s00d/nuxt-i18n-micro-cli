import { isJsonObject, type JsonObject, type JsonValue } from '../types'
import type { I18nProject } from '../Project'

function syncByReference(reference: JsonObject, target: JsonObject): JsonObject {
  const result: JsonObject = {}

  for (const [key, referenceValue] of Object.entries(reference)) {
    const targetValue = target[key]

    if (isJsonObject(referenceValue)) {
      const nestedTarget = isJsonObject(targetValue)
        ? targetValue as JsonObject
        : {}
      result[key] = syncByReference(referenceValue as JsonObject, nestedTarget)
      continue
    }

    if (typeof targetValue === 'string') {
      result[key] = targetValue
      continue
    }

    result[key] = '' as JsonValue
  }

  return result
}

export function synchronizeProjectLocales(project: I18nProject): void {
  const referenceCode = project.config.locales[0]?.code || project.config.defaultLocale
  const referenceSet = project.getLocale(referenceCode)

  for (const locale of project.config.locales) {
    if (locale.code === referenceCode) {
      continue
    }

    const localeSet = project.getLocale(locale.code)
    localeSet.global = syncByReference(referenceSet.global, localeSet.global)

    const syncedPages: Record<string, JsonObject> = {}
    for (const pageScope of referenceSet.getPageScopes()) {
      const referencePage = referenceSet.pages[pageScope] ?? {}
      const localePage = localeSet.pages[pageScope] ?? {}
      syncedPages[pageScope] = syncByReference(referencePage, localePage)
    }
    localeSet.pages = syncedPages
    localeSet.isModified = true
  }
}
