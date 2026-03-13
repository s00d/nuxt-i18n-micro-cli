import type { I18nProject } from '../Project'

export interface ExtractedTranslationData {
  global: Set<string>
  pageSpecific: Record<string, Set<string>>
}

export function applyExtractedKeys(project: I18nProject, extracted: ExtractedTranslationData): void {
  for (const localeCode of project.getLocaleCodes()) {
    const localeSet = project.getLocale(localeCode)

    for (const key of extracted.global) {
      if (localeSet.getValue(key, 'global') === undefined) {
        localeSet.setValue(key, '', 'global')
      }
    }

    for (const [pageScope, keys] of Object.entries(extracted.pageSpecific)) {
      for (const key of keys) {
        if (localeSet.getValue(key, pageScope) === undefined) {
          localeSet.setValue(key, '', pageScope)
        }
      }
    }
  }
}
