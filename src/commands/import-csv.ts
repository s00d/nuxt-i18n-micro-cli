import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { importProjectFromCsv } from '../core/services/CsvService'
import { resolveProjectContext, sharedArgs } from './_shared'

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
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const csvDir = path.resolve(args.csvDir || 'csv_exports')
    await importProjectFromCsv(project, csvDir)
    consola.success('Imported translations and saved to JSON files.')
  },
})
