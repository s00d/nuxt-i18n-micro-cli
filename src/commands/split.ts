import path from 'node:path'
import fs from 'node:fs'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'split',
    description: 'Split large translation files into smaller ones based on specified criteria',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    maxKeys: {
      type: 'string',
      description: 'Maximum number of keys per file',
      default: '100',
    },
    maxDepth: {
      type: 'string',
      description: 'Maximum nesting depth for splitting',
      default: '2',
    },
    splitByPrefix: {
      type: 'boolean',
      description: 'Split files by key prefix',
      default: false,
    },
    outputDir: {
      type: 'string',
      description: 'Directory to save split translation files',
      default: 'locales/split',
    },
  },
  async run(context) {
    const args = context.args
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)
    const translationDir = args.translationDir || defaultTranslationDir
    const outputDir = args.outputDir || path.join(translationDir, 'split')
    const maxKeys = Number.parseInt(args.maxKeys || '100', 10)
    const maxDepth = Number.parseInt(args.maxDepth || '2', 10)

    // Функция для разделения переводов по количеству ключей
    const splitByKeyCount = (translations: Record<string, unknown>, maxKeys: number): Record<string, Record<string, unknown>> => {
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

      for (const [key, value] of Object.entries(translations)) {
        if (typeof value === 'object' && value !== null) {
          const nestedTranslations = splitByKeyCount(value as Record<string, unknown>, maxKeys)
          for (const [nestedKey, nestedValue] of Object.entries(nestedTranslations)) {
            processValue(`${key}.${nestedKey}`, nestedValue)
          }
        }
        else {
          processValue(key, value)
        }
      }

      if (Object.keys(currentTranslations).length > 0) {
        result[`part${currentFile}`] = currentTranslations
      }

      return result
    }

    // Функция для разделения переводов по глубине вложенности
    const splitByDepth = (translations: Record<string, unknown>, maxDepth: number, currentDepth = 0): Record<string, unknown> => {
      const result: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(translations)) {
        if (typeof value === 'object' && value !== null && currentDepth < maxDepth) {
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

    // Функция для разделения переводов по префиксу ключа
    const splitByPrefix = (translations: Record<string, unknown>): Record<string, Record<string, unknown>> => {
      const result: Record<string, Record<string, unknown>> = {}

      const processValue = (key: string, value: unknown) => {
        const prefix = key.split('.')[0]
        if (!result[prefix]) {
          result[prefix] = {}
        }
        result[prefix][key] = value
      }

      for (const [key, value] of Object.entries(translations)) {
        if (typeof value === 'object' && value !== null) {
          const nestedTranslations = splitByPrefix(value as Record<string, unknown>)
          for (const [nestedKey, nestedValue] of Object.entries(nestedTranslations)) {
            processValue(`${key}.${nestedKey}`, nestedValue)
          }
        }
        else {
          processValue(key, value)
        }
      }

      return result
    }

    // Создаем директорию для разделенных файлов
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    for (const locale of locales) {
      const { code } = locale
      const translationFilePath = path.join(translationDir, `${code}.json`)

      if (!fs.existsSync(translationFilePath)) {
        consola.warn(`Translation file for locale ${code} does not exist.`)
        continue
      }

      const rawTranslations = loadJsonFile(translationFilePath)
      if (typeof rawTranslations !== 'object' || rawTranslations === null) {
        consola.error(`Invalid translation file format for locale ${code}`)
        continue
      }
      const translations = rawTranslations as Record<string, unknown>
      let splitTranslations: Record<string, Record<string, unknown>>

      // Выбираем метод разделения в зависимости от опций
      if (args.splitByPrefix) {
        splitTranslations = splitByPrefix(translations)
      }
      else if (maxDepth) {
        const depthSplit = splitByDepth(translations, maxDepth)
        // Преобразуем результат в нужный формат
        splitTranslations = Object.entries(depthSplit).reduce((acc, [key, value]) => {
          const prefix = key.split('.')[0]
          if (!acc[prefix]) {
            acc[prefix] = {}
          }
          acc[prefix][key] = value
          return acc
        }, {} as Record<string, Record<string, unknown>>)
      }
      else {
        splitTranslations = splitByKeyCount(translations, maxKeys)
      }

      // Создаем директорию для локали
      const localeDir = path.join(outputDir, code)
      if (!fs.existsSync(localeDir)) {
        fs.mkdirSync(localeDir, { recursive: true })
      }

      // Записываем разделенные файлы
      for (const [partName, partTranslations] of Object.entries(splitTranslations)) {
        const partFilePath = path.join(localeDir, `${partName}.json`)
        writeJsonFile(partFilePath, partTranslations)
        consola.success(`Created split file: ${partFilePath}`)
      }

      consola.success(`Split translations for locale ${code} into ${Object.keys(splitTranslations).length} files`)
    }
  },
})
