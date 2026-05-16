import { dirname, join, relative } from 'pathe'
import { cliCommandFailedError, cliNotFoundError } from '../errors'
import {
  cleanupExtractedBackup,
  createBackupArchive,
  extractBackupArchive,
  getBackupList,
} from '../utils/backup'
import { collectFilesRecursive, ensureDirectoryExists, pathExists } from '../utils/dir'
import { copyFile } from '../utils/file'

export async function createProjectBackup(options: {
  translationDir: string
  backupDir: string
  password?: string
  comment?: string
}): Promise<string> {
  if (!pathExists(options.translationDir)) {
    throw cliNotFoundError('Translation directory does not exist', [], {
      Path: options.translationDir,
    })
  }

  return createBackupArchive({
    translationDir: options.translationDir,
    backupDir: options.backupDir,
    password: options.password,
    comment: options.comment,
  })
}

export function listProjectBackups(backupDir: string): string[] {
  if (!pathExists(backupDir)) {
    throw cliNotFoundError('Backup directory does not exist', [], { Path: backupDir })
  }

  const backups = getBackupList(backupDir)
  if (backups.length === 0) {
    throw cliNotFoundError('No backups found', [
      'Create a backup first: i18n-micro backup',
    ], { Directory: backupDir })
  }

  return backups
}

export async function restoreProjectFromBackup(options: {
  translationDir: string
  backupDir: string
  backup: string
  password?: string
}): Promise<string[]> {
  let extractPath: string | undefined
  const restoredFiles = new Set<string>()

  try {
    extractPath = await extractBackupArchive({
      translationDir: options.translationDir,
      backupDir: options.backupDir,
      backup: options.backup,
      password: options.password,
    })

    if (!extractPath) {
      throw cliCommandFailedError('Failed to extract backup: no path returned', [
        'Verify backup archive integrity and password (if encrypted).',
      ])
    }

    const jsonFiles = collectFilesRecursive(
      extractPath,
      (_fullPath, entry) => entry.name.endsWith('.json'),
    )

    for (const fullPath of jsonFiles) {
      const relativePath = relative(extractPath, fullPath)
      const targetPath = join(options.translationDir, relativePath)
      ensureDirectoryExists(dirname(targetPath))
      copyFile(fullPath, targetPath)
      restoredFiles.add(relativePath)
    }

    return Array.from(restoredFiles)
  }
  finally {
    if (extractPath) {
      cleanupExtractedBackup(extractPath)
    }
  }
}
