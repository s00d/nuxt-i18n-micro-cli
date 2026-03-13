import { defineCommand } from 'citty'
import { consola } from 'consola'
import { renameProjectKey } from '../core/services/RenameService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'rename',
    description: 'Safely rename translation key in locales and source files',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    from: {
      type: 'string',
      description: 'Source translation key to rename',
      required: true,
    },
    to: {
      type: 'string',
      description: 'Target translation key',
      required: true,
    },
    dryRun: {
      type: 'boolean',
      description: 'Preview changes without writing files',
      default: false,
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const result = renameProjectKey(project, {
      from: args.from,
      to: args.to,
      dryRun: args.dryRun,
    })

    if (!args.dryRun) {
      await project.save()
      consola.success(`Key renamed: ${args.from} -> ${args.to}`)
    }
    else {
      consola.info('Dry run - no files were modified.')
    }

    consola.info(
      `Locales updated: ${result.localesUpdated}, locale refs: ${result.localeReferencesUpdated}, source files: ${result.sourceFilesUpdated}, source replacements: ${result.sourceReplacements}`,
    )
  },
})
