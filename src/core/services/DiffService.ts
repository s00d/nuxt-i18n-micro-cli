import type { I18nProject } from '../Project'
import { getMissingEntries } from '../utils/key-diff'
import { buildPageLocaleRelativeFile } from '../utils/page-file'

export interface DiffResult {
  file: string
  type?: 'missing_in_locale'
  missingInLocale?: Array<{ key: string, defaultValue: string }>
}

export function buildProjectDiff(project: I18nProject): DiffResult[] {
  const defaultLocale = project.config.defaultLocale
  const defaultSet = project.getDefaultLocaleSet()
  const defaultGlobal = defaultSet.getFlatGlobalKeys()
  const defaultPageScopes = defaultSet.getPageScopes()
  const diffResults: DiffResult[] = []

  for (const locale of project.config.locales) {
    if (locale.code === defaultLocale) {
      continue
    }

    const localeSet = project.getLocale(locale.code)
    const localeGlobal = localeSet.getFlatGlobalKeys()
    const missingGlobal = getMissingEntries(defaultGlobal, localeGlobal)

    if (missingGlobal.length > 0) {
      diffResults.push({
        file: `${defaultLocale}.json`,
        missingInLocale: missingGlobal,
      })
    }

    for (const pageScope of defaultPageScopes) {
      const defaultPage = defaultSet.getFlatPageKeys(pageScope)
      const localePage = localeSet.getFlatPageKeys(pageScope)
      const missingInPage = getMissingEntries(defaultPage, localePage)

      if (missingInPage.length > 0) {
        diffResults.push({
          file: buildPageLocaleRelativeFile(pageScope, defaultLocale),
          missingInLocale: missingInPage,
        })
      }
    }
  }

  return diffResults
}
