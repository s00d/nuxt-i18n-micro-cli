import { isJsonObject } from '../types'
import { ensureDirectoryExists } from '../utils/dir'
import { flattenKeyValueEntries, writeJsonFile } from '../utils/json'
import {
  buildSplitLocaleDirectoryPath,
  buildSplitPartFilePath,
} from '../utils/translation-paths'
import type { I18nProject } from '../Project'

export interface SplitOptions {
  outputDir: string
  maxKeys: number
  maxDepth: number
  splitByPrefix: boolean
}

function getKeyPrefix(key: string): string {
  return key.split('.')[0]
}

function appendToPrefixGroup(
  groups: Record<string, Record<string, unknown>>,
  key: string,
  value: unknown,
): void {
  const prefix = getKeyPrefix(key)
  if (!groups[prefix]) {
    groups[prefix] = {}
  }
  groups[prefix][key] = value
}

function splitByKeyCount(translations: Record<string, unknown>, maxKeys: number): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {}
  let currentFile = 1
  let currentKeys = 0
  let currentTranslations: Record<string, unknown> = {}

  const processValue = (key: string, value: unknown) => {
    if (currentKeys >= maxKeys) {
      result[`part${currentFile}`] = currentTranslations
      currentFile++
      currentKeys = 0
      currentTranslations = {}
    }

    currentTranslations[key] = value
    currentKeys++
  }

  for (const [key, value] of flattenKeyValueEntries(translations)) {
    processValue(key, value)
  }

  if (Object.keys(currentTranslations).length > 0) {
    result[`part${currentFile}`] = currentTranslations
  }

  return result
}

function splitByDepth(translations: Record<string, unknown>, maxDepth: number, currentDepth = 0): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(translations)) {
    if (isJsonObject(value) && currentDepth < maxDepth) {
      const nestedTranslations = splitByDepth(value as Record<string, unknown>, maxDepth, currentDepth + 1)
      for (const [nestedKey, nestedValue] of Object.entries(nestedTranslations)) {
        result[`${key}.${nestedKey}`] = nestedValue
      }
    }
    else {
      result[key] = value
    }
  }

  return result
}

function splitByPrefix(translations: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {}
  for (const [key, value] of flattenKeyValueEntries(translations)) {
    appendToPrefixGroup(result, key, value)
  }
  return result
}

export function splitProjectTranslations(project: I18nProject, options: SplitOptions): Array<{ locale: string, parts: number }> {
  ensureDirectoryExists(options.outputDir)

  const summary: Array<{ locale: string, parts: number }> = []
  for (const localeCode of project.getLocaleCodes()) {
    const localeSet = project.getLocale(localeCode)
    const translations = localeSet.global as Record<string, unknown>
    let splitTranslations: Record<string, Record<string, unknown>>

    if (options.splitByPrefix) {
      splitTranslations = splitByPrefix(translations)
    }
    else if (options.maxDepth) {
      const depthSplit = splitByDepth(translations, options.maxDepth)
      splitTranslations = {}
      for (const [key, value] of Object.entries(depthSplit)) {
        appendToPrefixGroup(splitTranslations, key, value)
      }
    }
    else {
      splitTranslations = splitByKeyCount(translations, options.maxKeys)
    }

    const localeDir = buildSplitLocaleDirectoryPath(options.outputDir, localeCode)
    ensureDirectoryExists(localeDir)

    for (const [partName, partTranslations] of Object.entries(splitTranslations)) {
      const partFilePath = buildSplitPartFilePath(options.outputDir, localeCode, partName)
      writeJsonFile(partFilePath, partTranslations)
    }

    summary.push({ locale: localeCode, parts: Object.keys(splitTranslations).length })
  }

  return summary
}
