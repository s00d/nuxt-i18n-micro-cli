import { resolve } from 'pathe'
import { isJsonObject } from '../types'
import { isDirectoryPath, pathExists } from '../utils/dir'
import { writeTextFile } from '../utils/file'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { collectProjectSourceFiles, collectSourceFilesInDirectory } from '../utils/source-files'
import { FileProcessor } from '../text_converner/file-processor'
import { mergeTranslations, type NestedTranslations } from '../text_converner/translation-structure'

function getFilesToProcess(targetDir: string, customPath?: string) {
  if (customPath) {
    const resolvedPath = resolve(targetDir, customPath)

    if (!pathExists(resolvedPath)) {
      throw new Error(`Path does not exist: ${resolvedPath}`)
    }

    if (isDirectoryPath(resolvedPath)) {
      return collectSourceFilesInDirectory(resolvedPath)
    }

    const ext = resolvedPath.split('.').pop()?.toLowerCase()
    if (['vue', 'js', 'ts'].includes(ext || '')) {
      return [resolvedPath]
    }

    throw new Error(`Unsupported file type: ${resolvedPath}`)
  }

  return collectProjectSourceFiles(targetDir)
}

export function runTextToI18n(params: {
  cwd: string
  translationFile: string
  dryRun: boolean
  verbose: boolean
  context?: string
  customPath?: string
  extractOnlyDirectories?: string[]
  extractOnlyPatterns?: string[]
  keyOverrides?: Record<string, string>
  skippedKeys?: string[]
}) {
  const targetDir = resolve(params.cwd)
  const translationFile = resolve(params.translationFile)
  const translations = loadJsonFile(translationFile)

  if (!isJsonObject(translations)) {
    throw new Error('Invalid translation file. Please check the format.')
  }

  const processor = new FileProcessor(translations, {
    dryRun: params.dryRun,
    verbose: params.verbose,
    context: params.context || '',
    extractOnlyDirectories: params.extractOnlyDirectories,
    extractOnlyPatterns: params.extractOnlyPatterns,
    baseDir: targetDir,
    keyOverrides: params.keyOverrides,
    skippedKeys: params.skippedKeys,
  })

  const files = getFilesToProcess(targetDir, params.customPath)
  let processedFiles = 0
  for (const file of files) {
    const updatedContent = processor.processFile(file)
    if (!params.dryRun) {
      writeTextFile(file, updatedContent)
    }
    processedFiles++
  }

  const newTranslations = processor.getNewTranslations()
  if (!params.dryRun && newTranslations.size > 0) {
    const merged = mergeTranslations(translations as NestedTranslations, newTranslations)
    writeJsonFile(translationFile, merged)
  }

  return {
    files,
    processedFiles,
    newTranslations,
  }
}
