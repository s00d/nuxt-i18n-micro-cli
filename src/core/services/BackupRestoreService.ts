import { dirname, join, relative } from 'pathe'
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
    throw new Error('Translation directory does not exist')
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
    throw new Error('Backup directory does not exist')
  }

  const backups = getBackupList(backupDir)
  if (backups.length === 0) {
    throw new Error('No backups found')
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
      throw new Error('Failed to extract backup: no path returned')
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
