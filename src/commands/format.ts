import path from 'node:path'
import fs from 'node:fs'
import { defineCommand } from 'citty'
import consola from 'consola'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'format',
    description: 'Format translation files by sorting keys and applying consistent indentation',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing translation files',
      default: 'locales',
    },
    indent: {
      type: 'string',
      description: 'Number of spaces for indentation',
      default: '2',
    },
    sortKeys: {
      type: 'boolean',
      description: 'Sort translation keys alphabetically',
      default: true,
    },
  },
  async run({ args }) {
    const options = {
      translationDir: args.translationDir || 'locales',
      indent: Number.parseInt(args.indent || '2', 10),
      sortKeys: args.sortKeys ?? true,
      cwd: args.cwd || process.cwd(),
      logLevel: args.logLevel || 'info',
    }

    const translationDir = path.resolve(options.cwd, options.translationDir)
    const config = await getI18nConfig(options.cwd)

    if (!config) {
      throw new Error('Failed to load i18n configuration')
    }

    // Function to sort object keys
    const sortObjectKeys = (obj: Record<string, any>): Record<string, any> => {
      if (typeof obj !== 'object' || obj === null) {
        return obj
      }

      if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys)
      }

      const sorted: Record<string, any> = {}
      Object.keys(obj)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
          sorted[key] = sortObjectKeys(obj[key])
        })

      return sorted
    }

    // Format global translations
    for (const locale of config.locales) {
      const filePath = path.join(translationDir, `${locale.code}.json`)
      if (!fs.existsSync(filePath)) {
        consola.warn(`Translation file for locale ${locale.code} does not exist.`)
        continue
      }

      try {
        const translations = loadJsonFile(filePath)
        if (!translations || typeof translations !== 'object') {
          throw new Error(`Invalid translation file format for locale ${locale.code}`)
        }

        // Sort keys if sortKeys option is enabled
        const formattedTranslations = options.sortKeys
          ? sortObjectKeys(translations)
          : translations

        // Write formatted file
        writeJsonFile(filePath, formattedTranslations)
        consola.success(`Formatted translations for locale ${locale.code}`)
      }
      catch (error) {
        consola.error(`Error formatting translations for locale ${locale.code}:`, error)
      }
    }

    // Format page translations
    const pagesDir = path.join(translationDir, 'pages')
    if (fs.existsSync(pagesDir)) {
      for (const locale of config.locales) {
        const localePagesDir = path.join(pagesDir, locale.code)
        if (!fs.existsSync(localePagesDir)) {
          continue
        }

        const files = fs.readdirSync(localePagesDir)
        for (const file of files) {
          if (!file.endsWith('.json')) {
            continue
          }

          const filePath = path.join(localePagesDir, file)
          try {
            const translations = loadJsonFile(filePath)
            if (!translations || typeof translations !== 'object') {
              throw new Error(
                `Invalid translation file format for locale ${locale.code} in ${file}`,
              )
            }

            // Sort keys if sortKeys option is enabled
            const formattedTranslations = options.sortKeys
              ? sortObjectKeys(translations)
              : translations

            // Write formatted file
            writeJsonFile(filePath, formattedTranslations)
            consola.success(
              `Formatted translations for locale ${locale.code} in ${file}`,
            )
          }
          catch (error) {
            consola.error(
              `Error formatting translations for locale ${locale.code} in ${file}:`,
              error,
            )
          }
        }
      }
    }
  },
})
