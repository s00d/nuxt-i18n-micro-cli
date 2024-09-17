// src/commands/stats.ts

import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { loadJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'

export default defineCommand({
  meta: {
    name: 'stats',
    description: 'Display translation statistics for each locale',
  },
  args: {
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    full: {
      type: 'boolean',
      description: 'Display only combined translations statistics',
      default: false,
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, full?: boolean } }) {
    const cwd = resolve((args.cwd || '.').toString())

    const { locales, translationDir } = await getI18nConfig(cwd)

    // Load reference (default) locale for global translations
    const referenceLocale = locales[0].code
    const referenceGlobalTranslations = loadJsonFile(
      path.join(translationDir, `${referenceLocale}.json`),
    )
    const referenceGlobalKeys = Object.keys(flattenTranslations(referenceGlobalTranslations))

    const pagesDir = path.join(translationDir, 'pages')
    const pagePaths: string[] = []

    // Retrieve all paths for page-specific translations
    function getAllPagePaths(dir: string, basePath = '') {
      if (fs.existsSync(dir)) {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        entries.forEach((entry) => {
          const fullPath = path.join(dir, entry.name)
          const relativePath = path.join(basePath, entry.name)
          if (entry.isDirectory()) {
            getAllPagePaths(fullPath, relativePath)
          }
          else if (entry.isFile() && path.extname(entry.name) === '.json') {
            pagePaths.push(relativePath)
          }
        })
      }
    }

    getAllPagePaths(pagesDir)

    for (const locale of locales) {
      const { code } = locale

      // Global translations statistics
      const globalTranslations = loadJsonFile(path.join(translationDir, `${code}.json`))
      const globalKeys = Object.keys(flattenTranslations(globalTranslations))
      const translatedGlobalKeys = globalKeys.filter((key) => {
        const value = getNestedValue(globalTranslations, key)
        return value && value !== ''
      })

      const globalPercentage = ((translatedGlobalKeys.length / referenceGlobalKeys.length) * 100).toFixed(2)

      let totalPageKeys = 0
      let totalTranslatedPageKeys = 0

      // Page-specific translations statistics
      for (const relativePath of pagePaths) {
        const referencePageTranslations = loadJsonFile(path.join(translationDir, 'pages', relativePath.replace(`${referenceLocale}.json`, `${referenceLocale}.json`)))
        const referencePageKeys = Object.keys(flattenTranslations(referencePageTranslations))

        const pageTranslationPath = path.join(translationDir, 'pages', relativePath.replace(`${referenceLocale}.json`, `${code}.json`))
        let pageTranslations: Record<string, unknown> = {}
        if (fs.existsSync(pageTranslationPath)) {
          pageTranslations = loadJsonFile(pageTranslationPath)
        }

        const pageKeys = Object.keys(flattenTranslations(pageTranslations))
        const translatedPageKeys = pageKeys.filter((key) => {
          const value = getNestedValue(pageTranslations, key)
          return value && value !== ''
        })

        const pagePercentage = ((translatedPageKeys.length / referencePageKeys.length) * 100).toFixed(2)

        if (args.full) {
          consola.info(`Page: ${relativePath} - Translated keys: ${translatedPageKeys.length} / ${referencePageKeys.length} (${pagePercentage}%)`)
        }

        totalPageKeys += referencePageKeys.length
        totalTranslatedPageKeys += translatedPageKeys.length
      }

      // Combined statistics
      const totalGlobalAndPageKeys = referenceGlobalKeys.length + totalPageKeys
      const totalTranslatedGlobalAndPageKeys = translatedGlobalKeys.length + totalTranslatedPageKeys
      const combinedPercentage = ((totalTranslatedGlobalAndPageKeys / totalGlobalAndPageKeys) * 100).toFixed(2)

      if (args.full) {
        consola.info(`Global: ${code} - Total keys: ${globalKeys.length}, Translated keys: ${translatedGlobalKeys.length}, Completion: ${globalPercentage}%`)
      }

      consola.info(`Combined translations: ${code} - Total keys: ${totalGlobalAndPageKeys}, Translated keys: ${totalTranslatedGlobalAndPageKeys}, Completion: ${combinedPercentage}%`)
    }
  },
})

function flattenTranslations(translations: Record<string, unknown>, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {}
  for (const key in translations) {
    const value = translations[key]
    const newPrefix = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      result[newPrefix] = value
    }
    else if (typeof value === 'object' && value !== null) {
      result = { ...result, ...flattenTranslations(value as Record<string, unknown>, newPrefix) }
    }
  }
  return result
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>(
    (o: unknown, k: string) => {
      if (o && typeof o === 'object') {
        return (o as Record<string, unknown>)[k]
      }
      else {
        return undefined
      }
    },
    obj,
  )
}
