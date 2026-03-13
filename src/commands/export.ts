import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { exportProjectToPo } from '../core/services/PoService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'export',
    description: 'Export translations to PO files for external translation management',
  },
  args: {
    ...sharedArgs,
    potsDir: {
      type: 'string',
      description: 'Directory to save PO files',
      default: 'pots',
    },
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
  },
  async run({ args }) {
    const { cwd, project } = await resolveProjectContext(args)
    const potsDir = path.resolve(cwd, args.potsDir || 'pots')
    await exportProjectToPo(project, potsDir)

    consola.success('Translations were exported to PO files.')
  },
})
