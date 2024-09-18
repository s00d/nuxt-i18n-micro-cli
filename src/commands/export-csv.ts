import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { stringify } from 'csv-stringify/sync' // Use csv-stringify for CSV generation
import { loadJsonFile } from '../utils/json'
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

    const jsonPaths = getAllJsonPaths(translationDir)

    for (const locale of locales) {
      const { code } = locale
      const localeCsvPath = path.join(csvDir, `${code}.csv`)
      const csvData: Array<[string, string, string]> = [] // Includes file path, key, translation

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

function getAllJsonPaths(dir: string, basePath = ''): string[] {
  const paths: string[] = []
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(basePath, entry.name)
      if (entry.isDirectory()) {
        paths.push(...getAllJsonPaths(fullPath, relativePath))
      }
      else if (entry.isFile() && path.extname(entry.name) === '.json') {
        paths.push(fullPath)
      }
    })
  }
  return paths
}

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
