import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { getNestedValue, loadJsonFile, parseOptions, setNestedValue, writeJsonFile } from '../utils/json'
import { translateText } from '../utils/translate'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'translate',
    description: 'Automatically translate missing keys using external translation services',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    service: {
      type: 'string',
      description: 'Translation service to use (e.g., google,deepl,yandex)',
      default: 'google',
    },
    token: {
      type: 'string',
      description: 'API key corresponding to the translation service',
      required: false,
    },
    options: {
      type: 'string',
      description: 'Additional options for the translation service in key:value pairs, separated by commas',
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, service: string, token: string, options?: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())

    const { locales, translationDir, defaultLocale } = await getI18nConfig(cwd, args.logLevel)

    const options = args.options ? parseOptions(args.options) : {}

    // Получаем список страниц, сканируя директорию translationDir/pages
    const pagesDir = path.join(translationDir, 'pages')
    const pagePaths: string[] = []

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

    // Загружаем глобальные переводы для defaultLocale
    const defaultGlobalTranslations = loadJsonFile(path.join(translationDir, `${defaultLocale}.json`))

    // Загружаем страницы и их переводы для defaultLocale
    const defaultPageTranslations: { [pagePath: string]: Record<string, unknown> } = {}
    pagePaths.forEach((relativePath) => {
      const fullPath = path.join(translationDir, 'pages', relativePath)
      const translations = loadJsonFile(fullPath)
      defaultPageTranslations[relativePath] = translations
    })

    for (const locale of locales) {
      const { code } = locale
      if (code === defaultLocale) continue

      // Загружаем глобальные переводы для текущей локали
      const globalTranslations = loadJsonFile(path.join(translationDir, `${code}.json`))

      // Ищем и переводим отсутствующие глобальные ключи
      await processTranslations(
        defaultGlobalTranslations,
        globalTranslations,
        defaultLocale,
        code,
        args.service,
        args.token,
        options,
        path.join(translationDir, `${code}.json`),
      )

      // Обрабатываем страницы
      for (const relativePath of pagePaths) {
        const defaultTranslations = defaultPageTranslations[relativePath]
        const targetTranslationPath = path.join(translationDir, 'pages', relativePath.replace(`${defaultLocale}.json`, `${code}.json`))

        let targetTranslations: Record<string, unknown> = {}
        if (fs.existsSync(targetTranslationPath)) {
          targetTranslations = loadJsonFile(targetTranslationPath)
        }

        // Ищем и переводим отсутствующие ключи для текущей страницы
        await processTranslations(
          defaultTranslations,
          targetTranslations,
          defaultLocale,
          code,
          args.service,
          args.token,
          options,
          targetTranslationPath,
        )
      }
    }

    consola.success('Missing translations have been automatically translated.')
  },
})

async function processTranslations(
  defaultTranslations: Record<string, unknown>,
  targetTranslations: Record<string, unknown>,
  defaultLocale: string,
  targetLocale: string,
  service: string,
  token: string,
  options: { [key: string]: any },
  savePath: string,
) {
  const missingKeys = findMissingTranslations(defaultTranslations, targetTranslations)

  if (missingKeys.length === 0) {
    consola.info(`No missing translations for locale ${targetLocale} in ${savePath}`)
    return
  }

  for (const key of missingKeys) {
    const textToTranslate = getNestedValue(defaultTranslations, key) as string

    let translatedText: string | null = null

    try {
      consola.info(`Translating key ${key} for locale ${targetLocale}...`)

      translatedText = await translateText(
        textToTranslate,
        defaultLocale,
        targetLocale,
        service,
        token,
        options,
      )

      if (!translatedText) {
        consola.error(`Failed to translate key ${key} using ${service}`)
      }
      else {
        consola.info(`Translated key ${key} for locale ${targetLocale} using ${service}, value: ${translatedText}`)
        setNestedValue(targetTranslations, key, translatedText)
      }
    }
    catch (error) {
      consola.error(`Failed to translate key ${key} using ${service}: ${(error as Error).message}`)
    }
  }

  // Сохраняем обновленные переводы
  writeJsonFile(savePath, targetTranslations)
}

function findMissingTranslations(
  defaultTranslations: Record<string, unknown>,
  targetTranslations: Record<string, unknown>,
  prefix = '',
): string[] {
  let missingKeys: string[] = []
  for (const key in defaultTranslations) {
    const defaultValue = defaultTranslations[key]
    const targetValue = targetTranslations[key]
    const newPrefix = prefix ? `${prefix}.${key}` : key

    if (typeof defaultValue === 'object' && defaultValue !== null) {
      if (typeof targetValue === 'object' && targetValue !== null) {
        missingKeys = missingKeys.concat(
          findMissingTranslations(
            defaultValue as Record<string, unknown>,
            targetValue as Record<string, unknown>,
            newPrefix,
          ),
        )
      }
      else {
        missingKeys = missingKeys.concat(
          findMissingTranslations(defaultValue as Record<string, unknown>, {}, newPrefix),
        )
      }
    }
    else {
      if (targetValue === undefined || targetValue === '') {
        missingKeys.push(newPrefix)
      }
    }
  }
  return missingKeys
}
