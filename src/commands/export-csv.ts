import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { exportProjectToCsv } from '../core/services/CsvService'
import { resolveProjectContext, sharedArgs } from './_shared'

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
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const csvDir = path.resolve(args.csvDir || 'csv_exports')
    await exportProjectToCsv(project, csvDir)
    consola.success(`Exported translations to ${csvDir}`)
  },
})
