import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ZipArchive } from 'archiver'
import extractZip from 'extract-zip'
import { collectFilesRecursive } from '../../utils/dir'
import { parseJsonFile } from '../../utils/json'
import type { JsonObject } from '../../types'
import type { LocaleTranslations } from '../types'

function withTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

export async function createZipFromTranslations(
  translations: LocaleTranslations,
  fileNameByLocale?: (locale: string) => string,
): Promise<Buffer> {
  const tmpDir = withTempDir('i18n-remote-zip-')
  const zipPath = path.join(tmpDir, 'bundle.zip')

  try {
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath)
      const archive = new ZipArchive({ zlib: { level: 9 } })
      output.on('close', () => resolve())
      archive.on('error', reject)
      archive.pipe(output)

      for (const [locale, content] of Object.entries(translations)) {
        const fileName = fileNameByLocale ? fileNameByLocale(locale) : `${locale}.json`
        archive.append(JSON.stringify(content, null, 2), { name: fileName })
      }

      archive.finalize().catch(reject)
    })

    return fs.readFileSync(zipPath)
  }
  finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

export async function parseTranslationsFromZip(
  zipBuffer: Buffer,
  localeFromFileName?: (fileName: string) => string | null,
): Promise<LocaleTranslations> {
  const tmpDir = withTempDir('i18n-remote-unzip-')
  const zipPath = path.join(tmpDir, 'bundle.zip')
  const extractDir = path.join(tmpDir, 'extracted')
  const result: LocaleTranslations = {}

  try {
    fs.writeFileSync(zipPath, zipBuffer)
    fs.mkdirSync(extractDir, { recursive: true })
    await extractZip(zipPath, { dir: extractDir })

    const files = collectFilesRecursive(
      extractDir,
      (_fullPath, entry) => entry.isFile() && entry.name.endsWith('.json'),
    )
    for (const filePath of files) {
      const relative = path.relative(extractDir, filePath).replaceAll(path.sep, '/')
      const locale = localeFromFileName ? localeFromFileName(relative) : defaultLocaleFromFileName(relative)
      if (!locale) {
        continue
      }
      const parsed = parseJsonFile(filePath)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        result[locale] = parsed as JsonObject
      }
    }
    return result
  }
  finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

function defaultLocaleFromFileName(fileName: string): string | null {
  const base = path.basename(fileName)
  if (!base.endsWith('.json')) {
    return null
  }
  return base.slice(0, -'.json'.length)
}
