import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { flattenTranslations, loadJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'validate',
    description: 'Validate translation files for missing or extra keys',
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

    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)

    const translationDir = args.translationDir || defaultTranslationDir

    // Эталонная локаль
    const referenceLocale = locales[0].code
    const referenceTranslations = loadJsonFile(path.join(translationDir, `${referenceLocale}.json`))
    const referenceKeys = Object.keys(flattenTranslations(referenceTranslations))

    let hasErrors = false

    for (const locale of locales) {
      const { code } = locale
      if (code === referenceLocale) continue

      const translations = loadJsonFile(path.join(translationDir, `${code}.json`))
      const keys = Object.keys(flattenTranslations(translations))

      const missingKeys = referenceKeys.filter(key => !keys.includes(key))
      const extraKeys = keys.filter(key => !referenceKeys.includes(key))

      if (missingKeys.length > 0) {
        hasErrors = true
        consola.warn(`Locale ${code} is missing keys:\n${missingKeys.join('\n')}`)
      }

      if (extraKeys.length > 0) {
        hasErrors = true
        consola.warn(`Locale ${code} has extra keys:\n${extraKeys.join('\n')}`)
      }
    }

    if (hasErrors) {
      consola.error('Validation failed with errors.')
      process.exit(1)
    }
    else {
      consola.success('All translation files are valid.')
    }
  },
})
