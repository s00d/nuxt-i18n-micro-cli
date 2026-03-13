import { basename, dirname, join, relative } from 'pathe'
import { isJsonObject, type JsonObject } from '../types'
import { collectFilesRecursive, ensureDirectoryExists } from '../utils/dir'
import { deleteFile, getFileMetadata, readTextFile, writeTextFile } from '../utils/file'
import { flattenKeyValueEntries, parseJsonFile, writeJsonFile } from '../utils/json'
import { formatBytes } from '../utils/size'
import { collectProjectSourceFiles } from '../utils/source-files'

export interface TranslationFile {
  path: string
  content: JsonObject
  size: number
  keys: string[]
}

export interface FileAnalysis {
  totalFiles: number
  totalSize: number
  averageSize: number
  largeFiles: TranslationFile[]
  deepNestingFiles: Array<TranslationFile & { maxDepth: number }>
  duplicateKeysFiles: Array<TranslationFile & { duplicateKeys: string[] }>
}

export interface OptimizeRunResult {
  analysis: FileAnalysis
  pathMappings: Map<string, string>
}

async function processFilesWithSelfMapping<T extends TranslationFile>(
  files: T[],
  translationDir: string,
  pathMappings: Map<string, string>,
  optimize: (file: T) => Promise<void>,
): Promise<void> {
  for (const file of files) {
    const relativePath = relative(translationDir, file.path)
    await optimize(file)
    pathMappings.set(relativePath, relativePath)
  }
}

function getKeyDepth(key: string): number {
  return key.split('.').length
}

function findDuplicateKeys(obj: JsonObject): string[] {
  const seen = new Map<string, string>()
  const duplicates: string[] = []

  function process(value: JsonObject, prefix = '') {
    if (isJsonObject(value)) {
      for (const [key, val] of Object.entries(value)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (typeof val === 'string') {
          if (seen.has(val)) {
            duplicates.push(newKey)
          }
          else {
            seen.set(val, newKey)
          }
        }
        else if (isJsonObject(val)) {
          process(val, newKey)
        }
      }
    }
  }

  process(obj)
  return duplicates
}

export function analyzeFiles(files: TranslationFile[], minSize: number, maxDepth: number): FileAnalysis {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const largeFiles = files.filter(file => file.size > minSize)
  const deepNestingFiles = files
    .map(file => ({
      ...file,
      maxDepth: Math.max(...file.keys.map(getKeyDepth)),
    }))
    .filter(file => file.maxDepth > maxDepth)
  const duplicateKeysFiles = files
    .map(file => ({
      ...file,
      duplicateKeys: findDuplicateKeys(file.content),
    }))
    .filter(file => file.duplicateKeys.length > 0)

  return {
    totalFiles: files.length,
    totalSize,
    averageSize: files.length === 0 ? 0 : totalSize / files.length,
    largeFiles,
    deepNestingFiles,
    duplicateKeysFiles,
  }
}

function flattenObject(obj: JsonObject, maxDepth: number, currentDepth = 1, prefix = ''): JsonObject {
  if (currentDepth >= maxDepth) {
    return obj
  }

  return Object.entries(obj).reduce<JsonObject>((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (isJsonObject(value)) {
      if (currentDepth + 1 >= maxDepth) {
        acc[newKey] = value
      }
      else {
        Object.assign(acc, flattenObject(value, maxDepth, currentDepth + 1, newKey))
      }
    }
    else {
      acc[newKey] = value
    }
    return acc
  }, {})
}

function removeDuplicateKeys(obj: JsonObject): JsonObject {
  const seen = new Map<string, string>()

  function process(value: JsonObject, prefix = ''): JsonObject {
    if (isJsonObject(value)) {
      const processed: JsonObject = {}
      for (const [key, val] of Object.entries(value)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (typeof val === 'string') {
          if (!seen.has(val)) {
            seen.set(val, newKey)
            processed[key] = val
          }
        }
        else if (isJsonObject(val)) {
          processed[key] = process(val, newKey)
        }
        else {
          processed[key] = val
        }
      }
      return processed
    }
    return value
  }

  return process(obj)
}

async function optimizeLargeFile(file: TranslationFile) {
  const dir = dirname(file.path)
  const baseName = basename(file.path, '.json')
  const newDir = join(dir, baseName)
  ensureDirectoryExists(newDir)

  const mappings = []
  for (const [key, value] of Object.entries(file.content)) {
    const newPath = join(newDir, `${key}.json`)
    writeJsonFile(newPath, value)

    if (isJsonObject(value)) {
      const keys = flattenKeyValueEntries(value).map(([nestedKey]) => nestedKey)
      for (const subKey of keys) {
        mappings.push({
          oldPath: `${key}.${subKey}`,
          newPath: key,
        })
      }
    }
  }

  deleteFile(file.path)
  return mappings
}

async function optimizeDeepNesting(file: TranslationFile & { maxDepth: number }, maxDepth: number) {
  const optimized = flattenObject(file.content, maxDepth)
  writeJsonFile(file.path, optimized)
}

async function optimizeDuplicateKeys(file: TranslationFile & { duplicateKeys: string[] }) {
  const optimized = removeDuplicateKeys(file.content)
  writeJsonFile(file.path, optimized)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function updateTranslationPaths(cwd: string, pathMapping: Map<string, string>) {
  const files = collectProjectSourceFiles(cwd)

  for (const file of files) {
    let content = readTextFile(file)
    let modified = false

    for (const [oldPath, newPath] of pathMapping) {
      const oldPattern = new RegExp(`\\$t\\(['"]${escapeRegExp(oldPath)}['"]\\)`, 'g')
      const newContent = content.replace(oldPattern, () => {
        modified = true
        return `$t('${newPath}')`
      })

      if (newContent !== content) {
        content = newContent
        modified = true
      }
    }

    if (modified) {
      writeTextFile(file, content)
    }
  }
}

export function collectTranslationFiles(translationDir: string): TranslationFile[] {
  const files: TranslationFile[] = []
  const jsonFiles = collectFilesRecursive(
    translationDir,
    (_fullPath, entry) => entry.name.endsWith('.json'),
  )

  for (const fullPath of jsonFiles) {
    const raw = parseJsonFile(fullPath)
    if (!isJsonObject(raw)) {
      continue
    }

    const fileMeta = getFileMetadata(fullPath)
    const keys = flattenKeyValueEntries(raw).map(([key]) => key)
    files.push({
      path: fullPath,
      content: raw,
      size: fileMeta.size,
      keys,
    })
  }

  return files
}

export async function runOptimization(options: {
  cwd: string
  translationDir: string
  minSize: number
  maxDepth: number
  updatePaths: boolean
  dryRun: boolean
}): Promise<OptimizeRunResult> {
  const files = collectTranslationFiles(options.translationDir)
  const analysis = analyzeFiles(files, options.minSize, options.maxDepth)
  const pathMappings = new Map<string, string>()

  if (options.dryRun) {
    return { analysis, pathMappings }
  }

  for (const file of analysis.largeFiles) {
    const mappings = await optimizeLargeFile(file)
    mappings.forEach(({ oldPath, newPath }) => {
      pathMappings.set(oldPath, newPath)
    })
  }

  await processFilesWithSelfMapping(
    analysis.deepNestingFiles,
    options.translationDir,
    pathMappings,
    file => optimizeDeepNesting(file, options.maxDepth),
  )

  await processFilesWithSelfMapping(
    analysis.duplicateKeysFiles,
    options.translationDir,
    pathMappings,
    optimizeDuplicateKeys,
  )

  if (options.updatePaths && pathMappings.size > 0) {
    await updateTranslationPaths(options.cwd, pathMappings)
  }

  return { analysis, pathMappings }
}

export function formatSize(bytes: number): string {
  return formatBytes(bytes)
}
