import type { I18nProject } from '../Project'
import { getMissingKeys } from '../utils/key-diff'

export interface ValidationIssue {
  locale: string
  missingKeys: string[]
  extraKeys: string[]
}

export function validateProjectLocales(project: I18nProject): ValidationIssue[] {
  const referenceCode = project.config.locales[0]?.code || project.config.defaultLocale
  const referenceSet = project.getLocale(referenceCode)
  const referenceKeys = Object.keys(referenceSet.getFlatGlobalKeys())
  const issues: ValidationIssue[] = []

  for (const locale of project.config.locales) {
    if (locale.code === referenceCode) {
      continue
    }

    const localeKeys = Object.keys(project.getLocale(locale.code).getFlatGlobalKeys())
    const missingKeys = getMissingKeys(referenceKeys, localeKeys)
    const extraKeys = getMissingKeys(localeKeys, referenceKeys)

    if (missingKeys.length > 0 || extraKeys.length > 0) {
      issues.push({
        locale: locale.code,
        missingKeys,
        extraKeys,
      })
    }
  }

  return issues
}
