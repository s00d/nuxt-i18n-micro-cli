import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { stringify } from 'csv-stringify/sync' // Use csv-stringify for CSV generation
import { flattenTranslations, getAllJsonPaths, loadJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'export-csv',
    description: 'Export translations to CSV files, including from subdirectories',
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
      description: 'Directory to save CSV files',
      default: 'csv_exports',
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, csvDir?: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)

    const translationDir = args.translationDir || defaultTranslationDir
    const csvDir = path.resolve(args.csvDir || 'csv_exports')
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true })
    }

    for (const locale of locales) {
      const { code } = locale
      const localeCsvPath = path.join(csvDir, `${code}.csv`)
      const csvData: Array<[string, string, string]> = [] // Includes file path, key, translation

      const jsonPaths = getAllJsonPaths(translationDir, code)
      for (const jsonPath of jsonPaths) {
        if (jsonPath.endsWith(`${code}.json`)) {
          const translations = loadJsonFile(jsonPath)
          const flattened = flattenTranslations(translations)
          const relativePath = path.relative(translationDir, jsonPath)
          for (const [key, value] of Object.entries(flattened)) {
            csvData.push([relativePath, key, value])
          }
        }
      }

      const csvContent = stringify(csvData, { columns: ['File', 'Key', 'Translation'] })
      fs.writeFileSync(localeCsvPath, csvContent)
      consola.success(`Exported translations for ${code} to ${localeCsvPath}`)
    }
  },
})
