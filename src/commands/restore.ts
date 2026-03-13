import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { listProjectBackups, restoreProjectFromBackup } from '../core/services/BackupRestoreService'
import { resolveCommandContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'restore',
    description: 'Restore translation files from a backup',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    backupDir: {
      type: 'string',
      description: 'Directory containing backup files',
      default: 'locales/backups',
    },
    backup: {
      type: 'string',
      description: 'Name of the backup to restore from (without .zip extension)',
    },
    password: {
      type: 'string',
      description: 'Password for decrypting the backup archive',
    },
    force: {
      type: 'boolean',
      description: 'Skip confirmation prompt',
      default: false,
    },
  },
  async run({ args }) {
    const { translationDir } = await resolveCommandContext(args)
    const backupDir = args.backupDir || path.join(translationDir, 'backups')
    const availableBackups = listProjectBackups(backupDir)

    if (!args.backup) {
      consola.info('Available backups:')
      availableBackups.forEach((backup, index) => {
        consola.info(`${index + 1}. ${backup}`)
      })
      return
    }

    if (!args.force) {
      const confirmed = await consola.prompt('Are you sure you want to restore from this backup? This will overwrite existing files.', {
        type: 'confirm',
      })
      if (!confirmed) {
        consola.info('Restore cancelled')
        return
      }
    }

    const restoredFiles = await restoreProjectFromBackup({
      translationDir,
      backupDir,
      backup: args.backup,
      password: args.password,
    })
    consola.success(`Restored ${restoredFiles.length} files from backup "${args.backup}"`)
  },
})
