import { defineCommand } from 'citty'
import { consola } from 'consola'
import { synchronizeProjectLocales } from '../core/services/SyncService'
import { resolveProjectContext, sharedArgs } from './_shared'

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
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    synchronizeProjectLocales(project)
    await project.save()
    consola.success('Translations have been synchronized.')
  },
})
