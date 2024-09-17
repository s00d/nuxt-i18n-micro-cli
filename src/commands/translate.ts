import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import prompts from 'prompts'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { translateText } from '../utils/translate'
import { getI18nConfig } from '../utils/kit'
import translatorRegistry from '../utils/translate/TranslatorRegistry'
import { sharedArgs } from "./_shared";

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
      description: 'Translation service to use (e.g., google, deepl, yandex)',
      required: false,
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
    replace: {
      type: 'boolean',
      description: 'Translate all keys, replacing existing translations',
      default: false,
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, service: string, token: string, options?: string, replace?: boolean, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())

    let service = args.service
    if (!service) {
      const response = await prompts({
        type: 'select',
        name: 'service',
        message: 'Choose a translation service',
        choices: Object.keys(translatorRegistry).map(key => ({ title: key, value: key })),
      })
      service = response.service
    }

    let token = args.token
    if (!token) {
      const response = await prompts({
        type: 'text',
        name: 'token',
        message: `Enter API key for ${service}`,
        validate: value => value ? true : 'API key is required',
      })
      token = response.token
    }

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
      const globalTranslationsPath = path.join(translationDir, `${code}.json`)
      let globalTranslations: Record<string, unknown> = {}
      if (fs.existsSync(globalTranslationsPath)) {
        globalTranslations = loadJsonFile(globalTranslationsPath)
      }

      consola.info(`Processing file: ${globalTranslationsPath}`)

      // Ищем и переводим ключи для глобальных переводов
      await processTranslations(
        defaultGlobalTranslations,
        globalTranslations,
        defaultLocale,
        code,
        service,
        token,
        options,
        globalTranslationsPath,
        args.replace ?? false,
      )

      // Обрабатываем страницы
      for (const relativePath of pagePaths) {
        const defaultTranslations = defaultPageTranslations[relativePath]
        const targetTranslationPath = path.join(translationDir, 'pages', relativePath.replace(`${defaultLocale}.json`, `${code}.json`))

        let targetTranslations: Record<string, unknown> = {}
        if (fs.existsSync(targetTranslationPath)) {
          targetTranslations = loadJsonFile(targetTranslationPath)
        }

        consola.info(`Processing file: ${targetTranslationPath}`)

        // Ищем и переводим ключи для текущей страницы
        await processTranslations(
          defaultTranslations,
          targetTranslations,
          defaultLocale,
          code,
          args.service,
          args.token,
          options,
          targetTranslationPath,
          args.replace ?? false,
        )
      }
    }

    consola.success('Translations have been automatically processed.')
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
  replace: boolean,
) {
  const keysToTranslate = getKeysToTranslate(defaultTranslations, targetTranslations, replace)

  if (keysToTranslate.length === 0) {
    consola.info(`No translations needed for locale ${targetLocale} in ${savePath}`)
    return
  }

  for (const key of keysToTranslate) {
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

function getKeysToTranslate(
  defaultTranslations: Record<string, unknown>,
  targetTranslations: Record<string, unknown>,
  replace: boolean,
  prefix = '',
): string[] {
  let keys: string[] = []
  for (const key in defaultTranslations) {
    const defaultValue = defaultTranslations[key]
    const targetValue = targetTranslations[key]
    const newPrefix = prefix ? `${prefix}.${key}` : key

    if (typeof defaultValue === 'object' && defaultValue !== null) {
      const nestedTargetValue = (typeof targetValue === 'object' && targetValue !== null) ? targetValue as Record<string, unknown> : {}
      keys = keys.concat(
        getKeysToTranslate(
          defaultValue as Record<string, unknown>,
          nestedTargetValue,
          replace,
          newPrefix,
        ),
      )
    }
    else {
      if (replace) {
        keys.push(newPrefix)
      }
      else {
        if (targetValue === undefined || targetValue === '') {
          keys.push(newPrefix)
        }
      }
    }
  }
  return keys
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const keys = key.split('.')
  let result: unknown = obj
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k]
    }
    else {
      return undefined
    }
  }
  return result
}

function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
  const keys = key.split('.')
  let current = obj
  keys.forEach((k, index) => {
    if (index === keys.length - 1) {
      current[k] = value
    }
    else {
      current[k] = current[k] || {}
      current = current[k] as Record<string, unknown>
    }
  })
}

function parseOptions(optionsStr: string): { [key: string]: any } {
  const options: { [key: string]: any } = {}
  const pairs = optionsStr.split(',')

  for (const pair of pairs) {
    const [key, value] = pair.split(':')
    if (key && value !== undefined) {
      const trimmedKey = key.trim()
      const trimmedValue = value.trim()

      // Попытка преобразовать значение в число или булево
      if (trimmedValue.toLowerCase() === 'true') {
        options[trimmedKey] = true
      }
      else if (trimmedValue.toLowerCase() === 'false') {
        options[trimmedKey] = false
      }
      else if (!Number.isNaN(Number(trimmedValue))) {
        options[trimmedKey] = Number(trimmedValue)
      }
      else {
        options[trimmedKey] = trimmedValue
      }
    }
  }

  return options
}
