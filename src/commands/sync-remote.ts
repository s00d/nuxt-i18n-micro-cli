import { defineCommand } from 'citty'
import { consola } from 'consola'
import { runRemoteSync, type RemoteSyncOptions } from '../core/services/RemoteSyncService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'sync-remote',
    description: 'Synchronize translations with remote storage',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing translation files',
    },
    pull: {
      type: 'boolean',
      description: 'Pull translations from remote storage',
      default: true,
    },
    push: {
      type: 'boolean',
      description: 'Push translations to remote storage',
      default: false,
    },
    force: {
      type: 'boolean',
      description: 'Force synchronization (overwrite local changes)',
      default: false,
    },
    dryRun: {
      type: 'boolean',
      description: 'Perform a dry run without making changes',
      default: false,
    },
  },
  async run({ args }) {
    const { cwd, translationDir, config, project } = await resolveProjectContext(args)
    const options: Partial<RemoteSyncOptions> = {
      pull: args.pull,
      push: args.push,
      force: args.force,
      dryRun: args.dryRun,
    }
    const result = await runRemoteSync({
      cwd,
      translationDir,
      localeCodes: config.locales.map(locale => locale.code),
      project,
      options,
    })

    if (result.dryRun) {
      consola.info('Dry run completed. No changes were made.')
    }
    else {
      if (result.added.length > 0) {
        consola.success(`Added ${result.added.length} new locales: ${result.added.join(', ')}`)
      }
      if (result.updated.length > 0) {
        consola.success(`Updated ${result.updated.length} locales: ${result.updated.join(', ')}`)
      }
      if (result.deleted.length > 0) {
        consola.warn(`Deleted ${result.deleted.length} locales: ${result.deleted.join(', ')}`)
      }
      if (result.conflicts.length > 0) {
        consola.warn(`Found ${result.conflicts.length} conflicts`)
        result.conflicts.forEach((conflict) => {
          consola.warn(`  ${conflict.key}:`)
          consola.warn(`    Local:  ${JSON.stringify(conflict.local)}`)
          consola.warn(`    Remote: ${JSON.stringify(conflict.remote)}`)
        })
      }
      if (result.errors.length > 0) {
        consola.error(`Encountered ${result.errors.length} errors:`)
        for (const error of result.errors) {
          consola.error(`  ${error.file}: ${error.error}`)
        }
      }
    }
  },
})
