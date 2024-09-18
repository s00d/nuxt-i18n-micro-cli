import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { loadJsonFile, writeJsonFile, flattenTranslations, setNestedValue } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'replace-values',
    description: 'Bulk replace translation values across all locales',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    search: {
      type: 'string',
      description: 'Text or regex pattern to search for',
      required: true,
    },
    replace: {
      type: 'string',
      description: 'Replacement text, can include regex group references',
      required: true,
    },
    useRegex: {
      type: 'boolean',
      description: 'Enable regex search for pattern matching',
      default: false,
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, search: string, replace: string, useRegex: boolean, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)
    const translationDir = args.translationDir || defaultTranslationDir

    // Compile the search pattern based on whether regex is enabled
    const searchPattern = args.useRegex ? new RegExp(args.search, 'g') : args.search

    for (const locale of locales) {
      const { code } = locale

      // Handle global translations
      const globalTranslationsPath = path.join(translationDir, `${code}.json`)
      if (fs.existsSync(globalTranslationsPath)) {
        let globalTranslations = loadJsonFile(globalTranslationsPath)
        globalTranslations = replaceTranslationValues(globalTranslations, searchPattern, args.replace, args.useRegex, code, 'global')
        writeJsonFile(globalTranslationsPath, globalTranslations)
        // consola.info(`Updated global translations for locale ${code}`)
      }

      // Handle page-specific translations
      const pagesDir = path.join(translationDir, 'pages')
      if (fs.existsSync(pagesDir)) {
        const pages = fs.readdirSync(pagesDir)
        for (const page of pages) {
          const pageTranslationsPath = path.join(pagesDir, page, `${code}.json`)
          if (fs.existsSync(pageTranslationsPath)) {
            let pageTranslations = loadJsonFile(pageTranslationsPath)
            pageTranslations = replaceTranslationValues(pageTranslations, searchPattern, args.replace, args.useRegex, code, page)
            writeJsonFile(pageTranslationsPath, pageTranslations)
            // consola.info(`Updated translations for page ${page} and locale ${code}`)
          }
        }
      }
    }

    consola.success('Translation values have been updated.')
  },
})

function replaceTranslationValues(
  translations: Record<string, unknown>,
  searchPattern: string | RegExp,
  replace: string,
  useRegex: boolean,
  locale: string,
  page?: string,
): Record<string, unknown> {
  const flattenedTranslations = flattenTranslations(translations)

  for (const key in flattenedTranslations) {
    const value = flattenedTranslations[key]
    if (typeof value === 'string') {
      const newValue = useRegex
        ? value.replace(searchPattern as RegExp, (_, ...groups) => {
          // Allow for replacement using group references ($1, $2, etc.)
          return replace.replace(/\$(\d+)/g, (_, groupIndex) => groups[groupIndex - 1] || '')
        })
        : value.replace(searchPattern as string, replace)

      if (newValue !== value) {
        consola.info(`Locale: ${locale}${page ? `, Page: ${page}` : ''} - Updated translation for key "${key}": "${value}" => "${newValue}"`)

        setNestedValue(translations, key, newValue)
      }
    }
  }

  return translations
}
