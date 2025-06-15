import path from 'node:path'
import fs from 'node:fs'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { getI18nConfig } from '../utils/kit'
import { createBackupArchive } from '../utils/backup'
import { sharedArgs } from './_shared'

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
  async run(context) {
    const args = context.args
    const cwd = resolve((args.cwd || '.').toString())
    const { translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)
    const translationDir = args.translationDir || defaultTranslationDir
    const backupDir = args.backupDir || path.join(translationDir, 'backups')

    if (!fs.existsSync(translationDir)) {
      throw new Error('Translation directory does not exist')
    }

    try {
      const backupPath = await createBackupArchive({
        translationDir,
        backupDir,
        password: args.password,
        comment: args.comment,
      })

      consola.success(`Backup created successfully at: ${backupPath}`)
    }
    catch (error) {
      consola.error('Failed to create backup:', error)
      throw error
    }
  },
})
