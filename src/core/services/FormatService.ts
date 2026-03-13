import type { I18nProject } from '../Project'
import type { JsonObject } from '../types'

function sortObjectKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => sortObjectKeys(item)) as T
  }

  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    Object.keys(value as Record<string, unknown>)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key])
      })
    return sorted as T
  }

  return value
}

export function sortProjectTranslations(project: I18nProject): void {
  for (const code of project.getLocaleCodes()) {
    const localeSet = project.getLocale(code)
    localeSet.global = sortObjectKeys(localeSet.global)

    const sortedPages: Record<string, JsonObject> = {}
    Object.keys(localeSet.pages)
      .sort((a, b) => a.localeCompare(b))
      .forEach((pageScope) => {
        sortedPages[pageScope] = sortObjectKeys(localeSet.pages[pageScope])
      })
    localeSet.pages = sortedPages
    localeSet.isModified = true
  }
}
