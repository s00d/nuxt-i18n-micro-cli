import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { loadKit } from '../utils/kit'
import { loadJsonFile } from '../utils/json'

export default defineCommand({
  meta: {
    name: 'validate',
    description: 'Validate translation files for missing or extra keys',
  },
  args: {
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())

    const kit = await loadKit(cwd)
    const nuxt = await kit.loadNuxt({
      cwd,
      dotenv: { cwd },
    })

    const locales = (nuxt.options as any).i18n.locales ?? []
    const translationDir = path.resolve(cwd, args.translationDir ?? (nuxt.options as any).i18n.translationDir ?? 'locales')

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

function flattenTranslations(translations: Record<string, unknown>, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {}
  for (const key in translations) {
    const value = translations[key]
    const newPrefix = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      result[newPrefix] = value
    }
    else if (typeof value === 'object' && value !== null) {
      result = { ...result, ...flattenTranslations(value as Record<string, unknown>, newPrefix) }
    }
  }
  return result
}
