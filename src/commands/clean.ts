import path from 'node:path'
import fs from 'node:fs'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { extractTranslations } from '../utils/components'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

interface Translations {
  [key: string]: unknown
  pages?: {
    [page: string]: {
      [key: string]: unknown
    }
  }
}

export default defineCommand({
  meta: {
    name: 'clean',
    description: 'Remove unused and empty translation keys from translation files',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    include: {
      type: 'string',
      description: 'Regular expression to include only matching keys',
      required: false,
    },
    exclude: {
      type: 'string',
      description: 'Regular expression to exclude matching keys',
      required: false,
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, logLevel?: string, include?: string, exclude?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())

    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)

    const translationDir = args.translationDir || defaultTranslationDir

    if (!fs.existsSync(translationDir)) {
      throw new Error('Translation directory does not exist')
    }

    // Извлекаем используемые ключи из кодовой базы
    const translationData = extractTranslations(cwd)
    const usedGlobalKeys = new Set(Array.from(translationData.global).map((key: string) => key.split('.')))
    const usedPageSpecificKeys = Object.entries(translationData.pageSpecific).reduce((acc, [page, keys]) => {
      acc[page] = new Set(Array.from(keys).map((key: string) => key.split('.')))
      return acc
    }, {} as Record<string, Set<string[]>>)

    // Компилируем регулярные выражения, если они предоставлены
    const includeRegex = args.include ? new RegExp(args.include) : null
    const excludeRegex = args.exclude ? new RegExp(args.exclude) : null

    // Функция для проверки ключа на соответствие фильтрам
    const shouldKeepKey = (key: string): boolean => {
      if (includeRegex && !includeRegex.test(key)) {
        return false
      }
      if (excludeRegex && excludeRegex.test(key)) {
        return false
      }
      return true
    }

    for (const locale of locales) {
      const { code } = locale
      const translationFilePath = path.join(translationDir, `${code}.json`)

      if (!fs.existsSync(translationFilePath)) {
        consola.warn(`Translation file for locale ${code} does not exist.`)
        continue
      }

      let translations: Translations
      try {
        translations = loadJsonFile(translationFilePath) as Translations
      }
      catch (error) {
        consola.warn(`Failed to load translations for locale ${code}: ${(error as Error).message}`)
        throw error
      }

      // Очищаем глобальные переводы
      const cleanedGlobalTranslations = cleanTranslations(
        translations,
        usedGlobalKeys,
        shouldKeepKey,
      )

      // Очищаем переводы для страниц
      if (translations.pages) {
        const cleanedPages: Record<string, Record<string, unknown>> = {}
        for (const [page, pageTranslations] of Object.entries(translations.pages)) {
          const usedKeys = usedPageSpecificKeys[page] || new Set<string[]>()
          const cleanedPageTranslations = cleanTranslations(
            pageTranslations,
            usedKeys as Set<string[]>,
            shouldKeepKey,
          )
          if (Object.keys(cleanedPageTranslations).length > 0) {
            cleanedPages[page] = cleanedPageTranslations
            // Создаем директорию для страничных переводов, если она не существует
            const pageDir = path.join(translationDir, 'pages', page)
            if (!fs.existsSync(pageDir)) {
              fs.mkdirSync(pageDir, { recursive: true })
            }
            // Записываем переводы для страницы в отдельный файл
            const pageTranslationPath = path.join(pageDir, `${code}.json`)
            writeJsonFile(pageTranslationPath, cleanedPageTranslations)
          }
        }
        if (Object.keys(cleanedPages).length > 0) {
          cleanedGlobalTranslations.pages = cleanedPages
        }
      }

      // Записываем очищенные переводы обратно в файл
      writeJsonFile(translationFilePath, cleanedGlobalTranslations)
      consola.success(`Cleaned translations for locale ${code}`)
    }
  },
})

function cleanTranslations(
  translations: Record<string, unknown>,
  usedKeys: Set<string[]>,
  shouldKeepKey: (key: string) => boolean,
  currentPath: string[] = [],
): Record<string, unknown> {
  const cleanedTranslations: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(translations)) {
    const fullPath = [...currentPath, key]
    const fullPathStr = fullPath.join('.')

    if (shouldKeepKey(fullPathStr)) {
      const isUsed = Array.from(usedKeys).some((usedKey) => {
        const usedKeyStr = usedKey.join('.')
        return usedKeyStr === fullPathStr || usedKeyStr.startsWith(fullPathStr + '.')
      })

      if (isUsed || (typeof value === 'object' && value !== null)) {
        if (typeof value === 'object' && value !== null) {
          const nestedCleaned = cleanTranslations(
            value as Record<string, unknown>,
            usedKeys,
            shouldKeepKey,
            fullPath,
          )
          if (Object.keys(nestedCleaned).length > 0) {
            cleanedTranslations[key] = nestedCleaned
          }
        }
        else if (value !== null && value !== undefined) {
          cleanedTranslations[key] = value
        }
      }
    }
  }

  return cleanedTranslations
}
