import { defineCommand } from 'citty'
import { consola } from 'consola'
import { normalizePageScope } from '../core/utils/page-file'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'check-duplicates',
    description: 'Check for duplicate translation values within each language across all files (global and pages)',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)

    for (const code of project.getLocaleCodes()) {
      const translationValuesMap = new Map<string, Set<string>>()
      const localeSet = project.getLocale(code)

      consola.info(`Checking for duplicates in locale: ${code}`)

      storeTranslationValues(localeSet.getFlatGlobalKeys(), 'global', translationValuesMap)

      for (const pageScope of localeSet.getPageScopes()) {
        const flatPageTranslations = localeSet.getFlatPageKeys(pageScope)
        storeTranslationValues(flatPageTranslations, `pages/${normalizePageScope(pageScope)}`, translationValuesMap)
      }

      let duplicatesFound = false
      for (const [value, locations] of translationValuesMap) {
        if (locations.size > 1) {
          duplicatesFound = true
          consola.warn(`Duplicate translation value "${value}" found in locale ${code}:`)
          const sortedLocations = [...locations].sort((a, b) => a.localeCompare(b))
          sortedLocations.forEach(location => consola.info(` - ${location}`))
        }
      }

      if (!duplicatesFound) {
        consola.success(`No duplicate values found for locale ${code}.`)
      }
      else {
        consola.warn(`Duplicate values detected for locale ${code}.`)
      }
    }
  },
})

function storeTranslationValues(
  translations: Record<string, string>,
  scope: string,
  translationValuesMap: Map<string, Set<string>>,
) {
  for (const key in translations) {
    const value = translations[key]
    const location = `${scope} - ${key}`

    if (!translationValuesMap.has(value)) {
      translationValuesMap.set(value, new Set())
    }

    translationValuesMap.get(value)?.add(location)
  }
}
