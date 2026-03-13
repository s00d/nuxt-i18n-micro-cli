import path from 'node:path'
import type { IStorage } from '../ports/IStorage'
import type { JsonObject, TranslationSetData } from '../types'
import { collectFilesRecursive } from '../utils/dir'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { normalizePageScope } from '../utils/page-file'

function collectLocalePageFiles(baseDir: string, code: string): string[] {
  return collectFilesRecursive(
    baseDir,
    (_fullPath, entry) => entry.name === `${code}.json`,
  )
}

export class FileSystemStorage implements IStorage {
  constructor(
    private readonly translationDir: string,
    private readonly sourceTranslationDirs: string[] = [translationDir],
  ) {}

  private mergeJson(target: JsonObject, source: JsonObject): JsonObject {
    const out: JsonObject = { ...target }
    for (const [key, value] of Object.entries(source)) {
      const prev = out[key]
      if (
        value
        && typeof value === 'object'
        && !Array.isArray(value)
        && prev
        && typeof prev === 'object'
        && !Array.isArray(prev)
      ) {
        out[key] = this.mergeJson(prev as JsonObject, value as JsonObject)
      }
      else {
        out[key] = value
      }
    }
    return out
  }

  async loadLocale(code: string): Promise<TranslationSetData> {
    let globalData: JsonObject = {}
    const pages: Record<string, JsonObject> = {}

    for (const sourceDir of this.sourceTranslationDirs) {
      const globalPath = path.join(sourceDir, `${code}.json`)
      globalData = this.mergeJson(globalData, loadJsonFile(globalPath) as JsonObject)

      const pagesDir = path.join(sourceDir, 'pages')
      const pageFiles = collectLocalePageFiles(pagesDir, code)
      for (const filePath of pageFiles) {
        const pageScope = normalizePageScope(path.relative(pagesDir, path.dirname(filePath)))
        const pageData = loadJsonFile(filePath) as JsonObject
        pages[pageScope] = this.mergeJson(pages[pageScope] || {}, pageData)
      }
    }

    return {
      global: globalData,
      pages,
    }
  }

  async saveLocale(code: string, data: TranslationSetData): Promise<void> {
    writeJsonFile(path.join(this.translationDir, `${code}.json`), data.global)

    const pagesDir = path.join(this.translationDir, 'pages')
    for (const [pageScope, pageData] of Object.entries(data.pages)) {
      const pageFilePath = path.join(pagesDir, ...pageScope.split('/'), `${code}.json`)
      writeJsonFile(pageFilePath, pageData)
    }
  }
}
