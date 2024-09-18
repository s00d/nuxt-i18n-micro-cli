import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { flattenTranslations, getAllJsonPaths, loadJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

interface DiffResult {
  file: string
  type?: 'missing_in_locale'
  missingInLocale?: Array<{ key: string, defaultValue: string }>
}

export default defineCommand({
  meta: {
    name: 'diff',
    description: 'Compares translation files between the default locale and other locales in the same directory, including subdirectories, showing missing keys and their values in the default locale.',
  },
  args: {
    ...sharedArgs,
  },
  async run({ args }: { args: { translationDir?: string, cwd?: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, defaultLocale, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)

    const sourceDir = args.translationDir || defaultTranslationDir

    if (!fs.existsSync(sourceDir)) {
      consola.error(`Source directory "${sourceDir}" does not exist.`)
      return
    }

    const defaultFiles = getAllJsonPaths(sourceDir, defaultLocale)

    const diffResults: DiffResult[] = []

    for (const locale of locales) {
      const { code } = locale
      if (code === defaultLocale) continue

      const localeFiles = getAllJsonPaths(sourceDir, code)

      defaultFiles.forEach((defaultFilePath) => {
        const relativePath = path.relative(sourceDir, defaultFilePath)
        const localeFilePath = defaultFilePath.replace(`${defaultLocale}.json`, `${code}.json`)

        if (!localeFiles.includes(localeFilePath)) {
          diffResults.push({ file: relativePath, type: 'missing_in_locale' })
          return
        }

        const defaultTranslations = loadJsonFile(defaultFilePath)
        const localeTranslations = loadJsonFile(localeFilePath)
        const flattenedDefaultTranslations = flattenTranslations(defaultTranslations)
        const flattenedLocaleTranslations = flattenTranslations(localeTranslations)

        const missingInLocale = Object.keys(flattenedDefaultTranslations)
          .filter(key => !(key in flattenedLocaleTranslations))
          .map(key => ({
            key,
            defaultValue: flattenedDefaultTranslations[key],
          }))

        if (missingInLocale.length > 0) {
          diffResults.push({
            file: relativePath,
            missingInLocale,
          })
        }
      })
    }

    console.log(JSON.stringify(diffResults, null, 2))
  },
})
