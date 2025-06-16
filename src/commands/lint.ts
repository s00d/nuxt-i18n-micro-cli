import { join } from 'node:path'
import fs, { existsSync, readdirSync } from 'node:fs'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { getI18nConfig } from '../utils/kit.js'
import { loadJsonFile } from '../utils/json.js'
import { sharedArgs } from './_shared.js'

interface LintRule {
  name: string
  description: string
  check: (value: string, context: { key: string, locale: string, file: string }) => boolean
  message: (value: string, context: { key: string, locale: string, file: string }) => string
  fix?: (value: string) => string
}

interface LintResult {
  file: string
  locale: string
  key: string
  value: string
  rule: string
  message: string
  fixedValue?: string
}

// Linting rules
const lintRules: LintRule[] = [
  {
    name: 'no-trailing-spaces',
    description: 'Check for trailing spaces',
    check: value => !value.includes('  \n') && !value.endsWith(' '),
    message: (value, { key, locale, file }) =>
      `Found trailing spaces in file ${file} for key ${key} (${locale})`,
    fix: value => value.replace(/\s+$/gm, ''),
  },
  {
    name: 'no-multiple-spaces',
    description: 'Check for multiple spaces',
    check: value => !value.includes('  '),
    message: (value, { key, locale, file }) =>
      `Found multiple spaces in file ${file} for key ${key} (${locale})`,
    fix: value => value.replace(/ {2,}/g, ' '),
  },
  {
    name: 'no-empty-translation',
    description: 'Check for empty translations',
    check: value => value.trim().length > 0,
    message: (value, { key, locale, file }) =>
      `Empty translation in file ${file} for key ${key} (${locale})`,
  },
  {
    name: 'no-html-tags',
    description: 'Check for HTML tags',
    check: value => !/<[^>]*>/.test(value),
    message: (value, { key, locale, file }) =>
      `Found HTML tags in file ${file} for key ${key} (${locale})`,
  },
  {
    name: 'no-special-chars',
    description: 'Check for special characters',
    check: value => !/[^\p{L}\p{N}\p{P}\s]/u.test(value),
    message: (value, { key, locale, file }) =>
      `Found special characters in file ${file} for key ${key} (${locale})`,
  },
  {
    name: 'no-mixed-case',
    description: 'Check for mixed case in sentence beginnings',
    check: (value) => {
      const sentences = value.split(/[.!?]\s+/)
      return sentences.every((sentence) => {
        if (sentence.length === 0) return true
        const firstChar = sentence[0]
        return firstChar === firstChar.toUpperCase() || !/[a-z]/i.test(firstChar)
      })
    },
    message: (value, { key, locale, file }) =>
      `Found sentence with incorrect case in file ${file} for key ${key} (${locale})`,
    fix: (value) => {
      return value.replace(/([.!?]\s+)([a-z])/g, (_, punctuation, letter) =>
        `${punctuation}${letter.toUpperCase()}`,
      )
    },
  },
  {
    name: 'no-missing-punctuation',
    description: 'Check for missing punctuation at sentence ends',
    check: (value) => {
      const sentences = value.split(/([.!?]\s+)/)
      return sentences.every((sentence) => {
        if (sentence.length === 0) return true
        if (/^[.!?]\s*$/.test(sentence)) return true
        return /[.!?]$/.test(sentence) || !/[a-z]/i.test(sentence)
      })
    },
    message: (value, { key, locale, file }) =>
      `Found sentence without punctuation in file ${file} for key ${key} (${locale})`,
    fix: (value) => {
      const parts = value.split(/([.!?]\s+)/)
      let result = ''

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (/^[.!?]\s*$/.test(part)) {
          result += part
          continue
        }

        if (part.trim().length > 0) {
          if (!/[.!?]$/.test(part) && /[a-z]/i.test(part)) {
            result += part.trim() + '.'
            if (i < parts.length - 1) result += ' '
          }
          else {
            result += part
          }
        }
      }

      return result
    },
  },
  {
    name: 'no-inconsistent-pluralization',
    description: 'Check for consistent pluralization',
    check: (value, { locale }) => {
      if (locale === 'en') {
        const words = value.toLowerCase().split(/\s+/)
        const hasPlural = words.some(word => word.endsWith('s') && !word.endsWith('ss'))
        const hasSingular = words.some(word => !word.endsWith('s') || word.endsWith('ss'))
        return !(hasPlural && hasSingular)
      }
      return true
    },
    message: (value, { key, locale, file }) =>
      `Found inconsistent pluralization in file ${file} for key ${key} (${locale})`,
  },
]

export default defineCommand({
  meta: {
    name: 'lint',
    description: 'Check translation quality',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing translation files',
      default: 'locales',
    },
    rules: {
      type: 'string',
      description: 'List of rules to check (comma-separated)',
      default: lintRules.map(rule => rule.name).join(','),
    },
    fix: {
      type: 'boolean',
      description: 'Automatically fix found issues',
      default: false,
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, rules?: string, fix?: boolean, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)
    const translationDir = resolve(cwd, args.translationDir || defaultTranslationDir)

    // Проверяем существование директории переводов
    if (!existsSync(translationDir)) {
      const error = new Error(`Translation directory "${translationDir}" does not exist`)
      consola.error(error.message)
      throw error
    }

    // Get list of rules to check
    const enabledRules = args.rules
      ? args.rules.split(',').map(name => name.trim())
      : lintRules.map(rule => rule.name)

    const rulesToCheck = lintRules.filter(rule => enabledRules.includes(rule.name))

    if (rulesToCheck.length === 0) {
      consola.warn('No rules to check')
      return
    }

    consola.info('Starting translation check...')
    consola.info(`Active rules: ${rulesToCheck.map(rule => rule.name).join(', ')}`)

    const results: LintResult[] = []

    // Check global translations
    for (const locale of locales) {
      const filePath = join(translationDir, `${locale.code}.json`)
      if (!existsSync(filePath)) {
        consola.warn(`Translation file not found: ${filePath}`)
        continue
      }

      try {
        const translations = loadJsonFile(filePath)
        checkTranslations(translations, rulesToCheck, {
          file: filePath,
          locale: locale.code,
          results,
        })
      }
      catch (error) {
        const message = `Error loading translation file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
        consola.error(message)
        throw new Error(message)
      }
    }

    // Check page translations
    const pagesDir = join(translationDir, 'pages')
    if (existsSync(pagesDir)) {
      const pagePaths: string[] = []

      function getAllPagePaths(dir: string, basePath = '') {
        if (existsSync(dir)) {
          const entries = readdirSync(dir, { withFileTypes: true })
          entries.forEach((entry) => {
            const fullPath = join(dir, entry.name)
            const relativePath = join(basePath, entry.name)
            if (entry.isDirectory()) {
              getAllPagePaths(fullPath, relativePath)
            }
            else if (entry.isFile() && entry.name.endsWith('.json')) {
              pagePaths.push(relativePath)
            }
          })
        }
      }

      getAllPagePaths(pagesDir)

      for (const locale of locales) {
        for (const pagePath of pagePaths) {
          const filePath = join(translationDir, 'pages', locale.code, pagePath)
          if (!existsSync(filePath)) {
            continue
          }

          const translations = loadJsonFile(filePath)
          checkTranslations(translations, rulesToCheck, {
            file: filePath,
            locale: locale.code,
            results,
          })
        }
      }
    }

    // Output results
    if (results.length === 0) {
      consola.success('Check completed. No issues found.')
      return
    }

    consola.warn(`Found ${results.length} issues:`)
    results.forEach((result) => {
      consola.warn(`[${result.rule}] ${result.message}`)
    })

    if (args.fix) {
      consola.info('Starting automatic fixes...')

      // Group results by file for optimized write operations
      const fileResultsMap = new Map<string, LintResult[]>()
      for (const result of results) {
        const fileResults = fileResultsMap.get(result.file) || []
        fileResults.push(result)
        fileResultsMap.set(result.file, fileResults)
      }

      let fixedCount = 0
      for (const [file, fileResults] of fileResultsMap) {
        try {
          const translations = loadJsonFile(file)
          let hasChanges = false

          for (const result of fileResults) {
            const rule = rulesToCheck.find(r => r.name === result.rule)
            if (rule?.fix) {
              const fixedValue = rule.fix(result.value)
              if (fixedValue !== result.value) {
                const keys = result.key.split('.')
                let current = translations

                // Find the object to modify
                for (let i = 0; i < keys.length - 1; i++) {
                  current = current[keys[i]] as Record<string, unknown>
                }

                // Apply the fix
                current[keys[keys.length - 1]] = fixedValue
                hasChanges = true
                fixedCount++
                consola.success(`Fixed [${result.rule}] in ${result.key}`)
              }
            }
          }

          if (hasChanges) {
            // Create backup before modifying
            const backupPath = `${file}.bak`
            fs.copyFileSync(file, backupPath)

            // Save the fixed file
            fs.writeFileSync(file, JSON.stringify(translations, null, 2), 'utf-8')
            consola.success(`Saved changes to ${file}`)
          }
        }
        catch (error) {
          const message = `Error fixing file ${file}: ${error instanceof Error ? error.message : String(error)}`
          consola.error(message)
          throw new Error(message)
        }
      }

      if (fixedCount > 0) {
        consola.success(`Fixed ${fixedCount} issues automatically`)
        consola.info('Backup files were created with .bak extension')
      }
      else {
        consola.info('No issues could be fixed automatically')
      }
    }

    // Если есть проблемы и не был включен режим фиксации, выбрасываем ошибку
    if (results.length > 0 && !args.fix) {
      throw new Error(`Found ${results.length} issues that need to be fixed`)
    }
  },
})

function checkTranslations(
  translations: Record<string, unknown>,
  rules: LintRule[],
  context: { file: string, locale: string, results: LintResult[] },
  prefix = '',
) {
  for (const [key, value] of Object.entries(translations)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null) {
      checkTranslations(value as Record<string, unknown>, rules, context, fullKey)
    }
    else if (typeof value === 'string') {
      for (const rule of rules) {
        if (!rule.check(value, { ...context, key: fullKey })) {
          context.results.push({
            file: context.file,
            locale: context.locale,
            key: fullKey,
            value,
            rule: rule.name,
            message: rule.message(value, { ...context, key: fullKey }),
          })
        }
      }
    }
  }
}
