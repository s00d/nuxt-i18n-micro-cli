import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { parse } from 'csv-parse/sync' // Use csv-parse for CSV parsing
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'import-csv',
    description: 'Import translations from CSV files, including from subdirectories',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    csvDir: {
      type: 'string',
      description: 'Directory containing CSV files to import',
      default: 'csv_exports',
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, csvDir?: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)

    const translationDir = args.translationDir || defaultTranslationDir
    const csvDir = path.resolve(args.csvDir || 'csv_exports')

    for (const locale of locales) {
      const { code } = locale
      const csvPath = path.join(csvDir, `${code}.csv`)
      if (!fs.existsSync(csvPath)) {
        consola.warn(`CSV file not found: ${csvPath}`)
        continue
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      const records = parse(csvContent, { columns: ['File', 'Key', 'Translation'], skip_empty_lines: true })

      for (const { File, Key, Translation } of records) {
        const targetPath = path.join(translationDir, File)
        let translations: Record<string, unknown> = {}
        if (fs.existsSync(targetPath)) {
          translations = loadJsonFile(targetPath)
        }

        setNestedValue(translations, Key, Translation)
        writeJsonFile(targetPath, translations)
        consola.success(`Updated ${Key} in ${targetPath}`)
      }
    }

    consola.success('Imported translations and saved to JSON files.')
  },
})

function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
  const keys = key.split('.')
  let current = obj
  keys.forEach((k, index) => {
    if (index === keys.length - 1) {
      current[k] = value
    }
    else {
      current[k] = current[k] || {}
      current = current[k] as Record<string, unknown>
    }
  })
}
