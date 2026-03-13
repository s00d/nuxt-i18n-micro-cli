import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { createProjectBackup } from '../core/services/BackupRestoreService'
import { resolveCommandContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'backup',
    description: 'Create a backup of translation files',
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
      description: 'Directory to save backup files',
      default: 'locales/backups',
    },
    password: {
      type: 'string',
      description: 'Password for encrypting the backup archive',
    },
    comment: {
      type: 'string',
      description: 'Comment to add to the backup archive',
    },
  },
  async run({ args }) {
    const { translationDir } = await resolveCommandContext(args)
    const backupDir = args.backupDir || path.join(translationDir, 'backups')
    const backupPath = await createProjectBackup({
      translationDir,
      backupDir,
      password: args.password,
      comment: args.comment,
    })
    consola.success(`Backup created successfully at: ${backupPath}`)
  },
})
