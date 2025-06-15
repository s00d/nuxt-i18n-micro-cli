import path from 'node:path'
import fs from 'node:fs'
import consola from 'consola'
import { loadJsonFile, writeJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'

interface FormatOptions {
  translationDir: string
  indent: number
  sortKeys: boolean
  backup: boolean
  cwd: string
  logLevel: string
}

interface CommandContext {
  args: {
    _: string[]
    translationDir?: string
    indent?: string
    sortKeys?: boolean
    backup?: boolean
    cwd?: string
    logLevel?: string
  }
  rawArgs: string[]
  cmd: any
}

const formatCommand = {
  name: 'format',
  description: 'Format translation files (sort keys, indentation, etc.)',
  async run(context: CommandContext) {
    const options: FormatOptions = {
      translationDir: context.args.translationDir || 'locales',
      indent: Number.parseInt(context.args.indent || '2', 10),
      sortKeys: context.args.sortKeys ?? true,
      backup: context.args.backup ?? false,
      cwd: context.args.cwd || process.cwd(),
      logLevel: context.args.logLevel || 'info',
    }

    const translationDir = path.resolve(options.cwd, options.translationDir)
    const config = await getI18nConfig(options.cwd)

    if (!config) {
      throw new Error('Failed to load i18n configuration')
    }

    // Создаем бэкап если указана опция backup
    if (options.backup) {
      const backupDir = path.join(translationDir, 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(backupDir, `format-${timestamp}`)

      fs.mkdirSync(backupPath, { recursive: true })

      // Копируем все файлы переводов в бэкап
      for (const locale of config.locales) {
        const localePath = path.join(translationDir, `${locale.code}.json`)
        if (fs.existsSync(localePath)) {
          fs.copyFileSync(
            localePath,
            path.join(backupPath, `${locale.code}.json`),
          )
        }

        // Копируем также файлы переводов для страниц
        const pagesDir = path.join(translationDir, 'pages')
        if (fs.existsSync(pagesDir)) {
          const localePagesDir = path.join(pagesDir, locale.code)
          if (fs.existsSync(localePagesDir)) {
            const backupPagesDir = path.join(backupPath, 'pages', locale.code)
            fs.mkdirSync(backupPagesDir, { recursive: true })

            const files = fs.readdirSync(localePagesDir)
            for (const file of files) {
              if (file.endsWith('.json')) {
                fs.copyFileSync(
                  path.join(localePagesDir, file),
                  path.join(backupPagesDir, file),
                )
              }
            }
          }
        }
      }

      consola.success('Created backup of translation files')
    }

    // Функция для сортировки ключей в объекте
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

    // Форматируем глобальные переводы
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

        // Сортируем ключи если указана опция sortKeys
        const formattedTranslations = options.sortKeys
          ? sortObjectKeys(translations)
          : translations

        // Записываем отформатированный файл
        writeJsonFile(filePath, formattedTranslations)
        consola.success(`Formatted translations for locale ${locale.code}`)
      }
      catch (error) {
        consola.error(`Error formatting translations for locale ${locale.code}:`, error)
      }
    }

    // Форматируем переводы для страниц
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

            // Сортируем ключи если указана опция sortKeys
            const formattedTranslations = options.sortKeys
              ? sortObjectKeys(translations)
              : translations

            // Записываем отформатированный файл
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
}

export default formatCommand
