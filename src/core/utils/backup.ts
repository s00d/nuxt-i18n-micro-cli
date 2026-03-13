import path from 'node:path'
import fs from 'node:fs'
import { createCipheriv, randomBytes } from 'node:crypto'
import archiver from 'archiver'
import extract from 'extract-zip'
import { consola } from 'consola'
import { ensureDirectoryExists } from './dir'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

export interface BackupOptions {
  translationDir: string
  backupDir: string
  comment?: string
  password?: string
}

export interface RestoreOptions {
  translationDir: string
  backupDir: string
  backup?: string
  password?: string
}

function listBackupArchives(backupDir: string): string[] {
  return fs.readdirSync(backupDir)
    .filter(name => name.endsWith('.zip'))
    .sort((a, b) => b.localeCompare(a))
}

export async function createBackupArchive(options: BackupOptions): Promise<string> {
  const { translationDir, backupDir, comment, password } = options

  ensureDirectoryExists(backupDir)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupName = comment
    ? `${timestamp}-${comment.replace(/[^a-z0-9-]/gi, '-')}`
    : timestamp
  const backupPath = path.join(backupDir, `${backupName}.zip`)

  const output = fs.createWriteStream(backupPath)
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  if (password) {
    const iv = randomBytes(IV_LENGTH)
    const key = Buffer.from(password.padEnd(32, '0').slice(0, 32), 'utf8')
    const cipher = createCipheriv(ALGORITHM, key, iv)

    archive.pipe(cipher).pipe(output)
    output.write(iv)
  }
  else {
    archive.pipe(output)
  }

  archive.directory(translationDir, false)

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      consola.success(`Created backup archive: ${backupPath}`)
      resolve(backupPath)
    })

    archive.on('error', (err: unknown) => {
      reject(err)
    })

    archive.finalize()
  })
}

export async function extractBackupArchive(options: RestoreOptions): Promise<string> {
  const { backupDir, backup, password } = options

  if (!fs.existsSync(backupDir)) {
    throw new Error('Backup directory does not exist')
  }

  const backups = listBackupArchives(backupDir)

  if (backups.length === 0) {
    throw new Error('No backups found')
  }

  if (!backup) {
    consola.info('Available backups:')
    backups.forEach((entry, index) => {
      consola.info(`${index + 1}. ${entry}`)
    })
    throw new Error('Please specify backup to restore')
  }

  const backupToRestore = backups.find(b => b === backup || b.startsWith(backup))
  if (!backupToRestore) {
    throw new Error(`Backup "${backup}" not found`)
  }

  const backupPath = path.join(backupDir, backupToRestore)
  const extractPath = path.join(backupDir, path.parse(backupToRestore).name)

  ensureDirectoryExists(extractPath)

  try {
    if (password) {
      const iv = Buffer.alloc(IV_LENGTH)

      const fd = fs.openSync(backupPath, 'r')
      fs.readSync(fd, iv, 0, IV_LENGTH, 0)
      fs.closeSync(fd)

      throw new Error('Password-protected archives are not supported yet')
    }

    await extract(backupPath, { dir: extractPath })
    consola.success(`Extracted backup to: ${extractPath}`)
    return extractPath
  }
  catch (err) {
    fs.rmSync(extractPath, { recursive: true, force: true })
    throw err
  }
}

export function getBackupList(backupDir: string): string[] {
  if (!fs.existsSync(backupDir)) {
    return []
  }

  return listBackupArchives(backupDir)
}

export function cleanupExtractedBackup(extractPath: string): void {
  if (fs.existsSync(extractPath)) {
    fs.rmSync(extractPath, { recursive: true, force: true })
  }
}
