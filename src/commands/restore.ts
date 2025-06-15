import path from 'node:path'
import fs from 'node:fs'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { getI18nConfig } from '../utils/kit'
import { extractBackupArchive, getBackupList, cleanupExtractedBackup } from '../utils/backup'
import { sharedArgs } from './_shared'

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
  async run(context) {
    const args = context.args
    const cwd = resolve((args.cwd || '.').toString())
    const { translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)
    const translationDir = args.translationDir || defaultTranslationDir
    const backupDir = args.backupDir || path.join(translationDir, 'backups')

    if (!fs.existsSync(backupDir)) {
      throw new Error('Backup directory does not exist')
    }

    const availableBackups = getBackupList(backupDir)
    if (availableBackups.length === 0) {
      throw new Error('No backups found')
    }

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

    let extractPath: string | undefined
    try {
      extractPath = await extractBackupArchive({
        translationDir,
        backupDir,
        backup: args.backup,
        password: args.password,
      })

      if (!extractPath) {
        throw new Error('Failed to extract backup: no path returned')
      }

      const restoredFiles = new Set<string>()
      const processDirectory = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          const relativePath = path.relative(extractPath!, fullPath)
          const targetPath = path.join(translationDir, relativePath)

          if (entry.isDirectory()) {
            if (!fs.existsSync(targetPath)) {
              fs.mkdirSync(targetPath, { recursive: true })
            }
            processDirectory(fullPath)
          }
          else if (entry.isFile() && entry.name.endsWith('.json')) {
            fs.copyFileSync(fullPath, targetPath)
            restoredFiles.add(relativePath)
          }
        }
      }

      processDirectory(extractPath)
      consola.success(`Restored ${restoredFiles.size} files from backup "${args.backup}"`)
    }
    catch (error) {
      consola.error('Failed to restore backup:', error)
      throw error
    }
    finally {
      if (extractPath && fs.existsSync(extractPath)) {
        cleanupExtractedBackup(extractPath)
      }
    }
  },
})
