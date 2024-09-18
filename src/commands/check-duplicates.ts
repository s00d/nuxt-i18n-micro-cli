import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { loadJsonFile, flattenTranslations } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

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
  async run({ args }: { args: { cwd?: string, translationDir?: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir } = await getI18nConfig(cwd, args.logLevel)

    // Для каждого языка проверяем на дубликаты
    for (const locale of locales) {
      const { code } = locale
      const translationValuesMap: Record<string, Set<string>> = {}

      consola.info(`Checking for duplicates in locale: ${code}`)

      // Проверяем глобальные переводы
      const globalTranslationsPath = path.join(translationDir, `${code}.json`)
      if (fs.existsSync(globalTranslationsPath)) {
        const globalTranslations = loadJsonFile(globalTranslationsPath)
        const flatGlobalTranslations = flattenTranslations(globalTranslations)
        storeTranslationValues(flatGlobalTranslations, 'global', translationValuesMap)
      }

      // Проверяем переводы на страницах
      const pagesDir = path.join(translationDir, 'pages')
      if (fs.existsSync(pagesDir)) {
        const pageDirs = fs.readdirSync(pagesDir)
        for (const page of pageDirs) {
          const pageTranslationPath = path.join(pagesDir, page, `${code}.json`)
          if (fs.existsSync(pageTranslationPath)) {
            const pageTranslations = loadJsonFile(pageTranslationPath)
            const flatPageTranslations = flattenTranslations(pageTranslations)
            storeTranslationValues(flatPageTranslations, `pages/${page}`, translationValuesMap)
          }
        }
      }

      // Выводим дубликаты для текущей локали
      let duplicatesFound = false
      for (const [value, locations] of Object.entries(translationValuesMap)) {
        if (locations.size > 1) {
          duplicatesFound = true
          consola.warn(`Duplicate translation value "${value}" found in locale ${code}:`)
          locations.forEach(location => consola.info(` - ${location}`))
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
  translationValuesMap: Record<string, Set<string>>,
) {
  for (const key in translations) {
    const value = translations[key]
    const location = `${scope} - ${key}`

    if (!translationValuesMap[value]) {
      translationValuesMap[value] = new Set()
    }

    translationValuesMap[value].add(location)
  }
}
