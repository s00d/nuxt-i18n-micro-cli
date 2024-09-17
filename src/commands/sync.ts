import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from "./_shared";

export default defineCommand({
  meta: {
    name: 'sync',
    description: 'Synchronize translation files across locales',
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

    // Эталонная локаль
    const referenceLocale = locales[0].code
    const referenceTranslations = loadJsonFile(path.join(translationDir, `${referenceLocale}.json`))

    for (const locale of locales) {
      const { code } = locale
      if (code === referenceLocale) continue

      const translations = loadJsonFile(path.join(translationDir, `${code}.json`))

      const synchronizedTranslations = synchronizeTranslations(referenceTranslations, translations)

      // Записываем обратно в файл
      const translationFilePath = path.join(translationDir, `${code}.json`)
      writeJsonFile(translationFilePath, synchronizedTranslations)

      consola.log(`Translations for locale ${code} have been synchronized.`)
    }
  },
})

function synchronizeTranslations(reference: Record<string, unknown>, target: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const key in reference) {
    const refValue = reference[key]
    const targetValue = target[key]

    if (typeof refValue === 'object' && refValue !== null) {
      if (typeof targetValue === 'object' && targetValue !== null) {
        result[key] = synchronizeTranslations(refValue as Record<string, unknown>, targetValue as Record<string, unknown>)
      }
      else {
        result[key] = synchronizeTranslations(refValue as Record<string, unknown>, {})
      }
    }
    else {
      if (typeof targetValue === 'string') {
        result[key] = targetValue
      }
      else {
        result[key] = ''
      }
    }
  }

  return result
}
