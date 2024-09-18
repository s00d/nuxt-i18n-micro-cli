import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { convertToNestedObjects, loadJsonFile } from '../utils/json'
import { ensureDirectoryExists } from '../utils/dir'
import { extractTranslations } from '../utils/components'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

// Интерфейсы для данных перевода и локалей

interface LocaleTranslation {
  global: Record<string, unknown>
  pageSpecific: Record<string, Record<string, unknown>>
}

export default defineCommand({
  meta: {
    name: 'extract',
    description: 'Extract translations and organize them by scope',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    prod: {
      type: 'boolean',
      description: 'production mode',
      alias: 'p',
    },
  },
  async run({ args }: { args: { cwd?: string, logLevel?: string, translationDir?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())

    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)

    const translationDir = args.translationDir || defaultTranslationDir

    ensureDirectoryExists(translationDir)

    const translationData = extractTranslations(cwd)

    const pageSpecificTranslations = Object.entries(translationData.pageSpecific).reduce((acc, [page, keys]) => {
      acc[page] = convertToNestedObjects(keys)
      return acc
    }, {} as Record<string, Record<string, unknown>>)

    // Создаем объекты локалей
    const localeObjects = locales.reduce((acc: Record<string, LocaleTranslation>, locale: { code: string }) => {
      const { code } = locale
      const globalTranslations = loadJsonFile(path.join(translationDir, `${code}.json`))
      const completeGlobalTranslations = {
        ...convertToNestedObjects(translationData.global),
        ...globalTranslations,
      }

      acc[code] = {
        global: completeGlobalTranslations,
        pageSpecific: Object.entries(pageSpecificTranslations).reduce((pageAcc, [page, translations]) => {
          const pageTranslationsPath = path.join(translationDir, 'pages', page, `${code}.json`)
          const loadedTranslations = loadJsonFile(pageTranslationsPath)

          // Добавляем все ключи с пустыми строками, если их нет в переводах
          const completeTranslations = Object.keys(translations).reduce((nestedAcc, key) => {
            const existingValue = key in loadedTranslations ? (loadedTranslations[key] as string) : ''
            nestedAcc[key] = existingValue || translations[key]
            return nestedAcc
          }, {} as Record<string, unknown>)

          pageAcc[page] = {
            ...loadedTranslations,
            ...completeTranslations,
          }
          return pageAcc
        }, {} as Record<string, Record<string, unknown>>),
      }
      return acc
    }, {} as Record<string, LocaleTranslation>)

    // Сохранение в формат JSON
    Object.entries(localeObjects).forEach(([locale, translation]) => {
      const { global, pageSpecific } = translation as LocaleTranslation

      const globalJsonPath = path.join(translationDir, `${locale}.json`)
      fs.writeFileSync(globalJsonPath, JSON.stringify(global, null, 2))

      Object.entries(pageSpecific).forEach(([page, translations]) => {
        const pageJsonPath = path.join(translationDir, 'pages', page, `${locale}.json`)
        ensureDirectoryExists(path.dirname(pageJsonPath))
        fs.writeFileSync(pageJsonPath, JSON.stringify(translations, null, 2))
      })
    })

    consola.log('Locale-specific translations have been saved to JSON files.')
  },
})
