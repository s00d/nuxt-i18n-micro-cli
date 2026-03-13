import fs from 'node:fs'
import path from 'node:path'
import fsExtra from 'fs-extra'

export function pathExists(targetPath: string): boolean {
  return fsExtra.pathExistsSync(targetPath)
}

export function isDirectoryPath(targetPath: string): boolean {
  try {
    return fs.statSync(targetPath).isDirectory()
  }
  catch {
    return false
  }
}

export function ensureDirectoryExists(dir: string): void {
  fsExtra.ensureDirSync(dir)
}

export function collectFilesRecursive(
  baseDir: string,
  predicate: (fullPath: string, entry: fs.Dirent) => boolean,
): string[] {
  if (!pathExists(baseDir)) {
    return []
  }

  const files: string[] = []
  const walk = (dir: string) => {
    let entries: unknown
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    }
    catch {
      return
    }
    if (!Array.isArray(entries)) {
      return
    }
    for (const rawEntry of entries) {
      const entry = typeof rawEntry === 'string'
        ? ({
            name: rawEntry,
            isDirectory: () => false,
            isFile: () => true,
          } as fs.Dirent)
        : rawEntry as fs.Dirent
      if (!entry || typeof entry.name !== 'string') {
        continue
      }
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      }
      else if (entry.isFile() && predicate(fullPath, entry)) {
        files.push(fullPath)
      }
    }
  }

  walk(baseDir)
  return files
}
