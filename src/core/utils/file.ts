import fsExtra from 'fs-extra'

export function copyFile(source: string, destination: string): void {
  fsExtra.copySync(source, destination)
}

export function writeFileBuffer(targetPath: string, content: Buffer): void {
  fsExtra.outputFileSync(targetPath, content)
}

export function writeTextFile(targetPath: string, content: string): void {
  fsExtra.outputFileSync(targetPath, content, 'utf-8')
}

export function readTextFile(targetPath: string): string {
  return fsExtra.readFileSync(targetPath, 'utf-8')
}

export interface FileMetadata {
  size: number
  modifiedAt: Date
}

export function getFileMetadata(targetPath: string): FileMetadata {
  const stats = fsExtra.statSync(targetPath)
  return {
    size: stats.size,
    modifiedAt: stats.mtime,
  }
}

export function deleteFile(targetPath: string): void {
  fsExtra.removeSync(targetPath)
}

export function removeDirectory(targetPath: string): void {
  fsExtra.removeSync(targetPath)
}
