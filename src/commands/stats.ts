// src/commands/stats.ts

import fs from 'node:fs'
import path from 'node:path'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { flattenTranslations, getNestedValue, loadJsonFile } from '../utils/json'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

interface TranslationStats {
  totalKeys: number
  translatedKeys: number
  completion: number
  averageKeyLength: number
  averageValueLength: number
  specialCharsCount: number
  emptyValues: number
  duplicateValues: string[]
  longestKeys: Array<{ key: string, length: number }>
  longestValues: Array<{ key: string, value: string, length: number }>
  formattingIssues: Array<{ key: string, issue: string }>
  valueTypes: {
    strings: number
    numbers: number
    booleans: number
    arrays: number
    objects: number
  }
  stringLengths: {
    short: number
    medium: number
    long: number
    veryLong: number
  }
  htmlTags: {
    count: number
    tags: Array<{ tag: string, count: number }>
  }
  variables: {
    count: number
    examples: Array<{ key: string, variables: string[] }>
  }
  specialChars: {
    punctuation: number
    emoji: number
    currency: number
    other: number
  }
  wordStats: {
    totalWords: number
    uniqueWords: number
    repeatedWords: Array<{ word: string, count: number }>
    averageWordLength: number
  }
  caseStats: {
    upperCase: number
    lowerCase: number
    titleCase: number
    mixedCase: number
  }
}

interface LocaleStats {
  code: string
  global: TranslationStats
  pages: Record<string, TranslationStats>
  combined: TranslationStats
}

interface StatsReport {
  locales: LocaleStats[]
  summary: {
    totalLocales: number
    totalFiles: number
    totalKeys: number
    averageCompletion: number
    localesByCompletion: Array<{ code: string, completion: number }>
    mostTranslatedLocale: string
    leastTranslatedLocale: string
  }
}

function analyzeTranslationStats(translations: Record<string, any>, referenceKeys: string[]): TranslationStats {
  const flatTranslations = flattenTranslations(translations)
  const keys = Object.keys(flatTranslations)
  const values = Object.values(flatTranslations)
  const translatedKeys = keys.filter((key) => {
    const value = getNestedValue(translations, key)
    return value && value !== ''
  })

  // Анализ типов значений
  const valueTypes = {
    strings: 0,
    numbers: 0,
    booleans: 0,
    arrays: 0,
    objects: 0,
  }
  values.forEach((value) => {
    if (typeof value === 'string') valueTypes.strings++
    else if (typeof value === 'number') valueTypes.numbers++
    else if (typeof value === 'boolean') valueTypes.booleans++
    else if (Array.isArray(value)) valueTypes.arrays++
    else if (typeof value === 'object' && value !== null) valueTypes.objects++
  })

  // Анализ длины строк
  const stringLengths = {
    short: 0,
    medium: 0,
    long: 0,
    veryLong: 0,
  }
  values.forEach((value) => {
    if (typeof value === 'string') {
      const length = value.length
      if (length <= 10) stringLengths.short++
      else if (length <= 50) stringLengths.medium++
      else if (length <= 100) stringLengths.long++
      else stringLengths.veryLong++
    }
  })

  // Анализ HTML-тегов
  const htmlTags = {
    count: 0,
    tags: [] as Array<{ tag: string, count: number }>,
  }
  const tagRegex = /<([a-z][a-z0-9]*)\b[^>]*>/gi
  const tagCount = new Map<string, number>()
  values.forEach((value) => {
    if (typeof value === 'string') {
      const matches = value.match(tagRegex)
      if (matches) {
        htmlTags.count += matches.length
        matches.forEach((tag) => {
          const tagName = tag.match(/<([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase()
          if (tagName) {
            tagCount.set(tagName, (tagCount.get(tagName) || 0) + 1)
          }
        })
      }
    }
  })
  htmlTags.tags = Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)

  // Анализ переменных
  const variables = {
    count: 0,
    examples: [] as Array<{ key: string, variables: string[] }>,
  }
  const varRegex = /\{([^}]+)\}/g
  values.forEach((value, index) => {
    if (typeof value === 'string') {
      const matches = Array.from(value.matchAll(varRegex))
      if (matches.length > 0) {
        variables.count += matches.length
        variables.examples.push({
          key: keys[index],
          variables: matches.map(m => m[1]),
        })
      }
    }
  })

  // Анализ специальных символов
  const specialChars = {
    punctuation: 0,
    emoji: 0,
    currency: 0,
    other: 0,
  }
  const punctuationRegex = /[.,!?;:]/g
  const emojiRegex = /\p{Emoji}/gu
  const currencyRegex = /[$€£¥₽₴₸₺₼₾₿]/g
  values.forEach((value) => {
    if (typeof value === 'string') {
      specialChars.punctuation += (value.match(punctuationRegex) || []).length
      specialChars.emoji += (value.match(emojiRegex) || []).length
      specialChars.currency += (value.match(currencyRegex) || []).length
      specialChars.other += (value.match(/[^a-z0-9\s.,!?;:$€£¥₽₴₸₺₼₾₿]/gi) || []).length
    }
  })

  // Анализ слов
  const wordStats = {
    totalWords: 0,
    uniqueWords: 0,
    repeatedWords: [] as Array<{ word: string, count: number }>,
    averageWordLength: 0,
  }
  const wordCount = new Map<string, number>()
  let totalWordLength = 0
  values.forEach((value) => {
    if (typeof value === 'string') {
      const words = value.toLowerCase().match(/\b\w+\b/g) || []
      wordStats.totalWords += words.length
      words.forEach((word) => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
        totalWordLength += word.length
      })
    }
  })
  wordStats.uniqueWords = wordCount.size
  wordStats.repeatedWords = Array.from(wordCount.entries())
    .filter(([_, count]) => count > 1)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
  wordStats.averageWordLength = wordStats.totalWords > 0 ? totalWordLength / wordStats.totalWords : 0

  // Анализ регистра
  const caseStats = {
    upperCase: 0,
    lowerCase: 0,
    titleCase: 0,
    mixedCase: 0,
  }
  values.forEach((value) => {
    if (typeof value === 'string') {
      if (value === value.toUpperCase()) caseStats.upperCase++
      else if (value === value.toLowerCase()) caseStats.lowerCase++
      else if (value === value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()) caseStats.titleCase++
      else caseStats.mixedCase++
    }
  })

  // Анализ длины ключей и значений
  const keyLengths = keys.map(key => key.length)
  const valueLengths = values.map(value => String(value).length)
  const averageKeyLength = keys.length > 0 ? keyLengths.reduce((a, b) => a + b, 0) / keys.length : 0
  const averageValueLength = values.length > 0 ? valueLengths.reduce((a, b) => a + b, 0) / values.length : 0

  // Поиск специальных символов
  const specialCharsRegex = /[^a-z0-9\s.,!?-]/gi
  const specialCharsCount = values.reduce((count, value) => {
    const matches = String(value).match(specialCharsRegex)
    return count + (matches ? matches.length : 0)
  }, 0)

  // Поиск пустых значений
  const emptyValues = values.filter(value => !value || value === '').length

  // Поиск дубликатов значений
  const valueMap = new Map<string, string[]>()
  values.forEach((value, index) => {
    const key = keys[index]
    const valueStr = String(value)
    if (!valueMap.has(valueStr)) {
      valueMap.set(valueStr, [])
    }
    valueMap.get(valueStr)?.push(key)
  })
  const duplicateValues = Array.from(valueMap.entries())
    .filter(([_, keys]) => keys.length > 1)
    .map(([value, keys]) => `${keys.join(', ')}: "${value}"`)

  // Поиск самых длинных ключей и значений
  const longestKeys = keys
    .map(key => ({ key, length: key.length }))
    .sort((a, b) => b.length - a.length)
    .slice(0, 5)

  const longestValues = values
    .map((value, index) => ({ key: keys[index], value: String(value), length: String(value).length }))
    .sort((a, b) => b.length - a.length)
    .slice(0, 5)

  // Проверка форматирования
  const formattingIssues: Array<{ key: string, issue: string }> = []
  values.forEach((value, index) => {
    const key = keys[index]
    const valueStr = String(value)
    if (valueStr.includes('  ')) {
      formattingIssues.push({ key, issue: 'Contains multiple spaces' })
    }
    if (valueStr.startsWith(' ') || valueStr.endsWith(' ')) {
      formattingIssues.push({ key, issue: 'Contains leading/trailing spaces' })
    }
    if (valueStr.includes('\n')) {
      formattingIssues.push({ key, issue: 'Contains newlines' })
    }
  })

  return {
    totalKeys: referenceKeys.length,
    translatedKeys: translatedKeys.length,
    completion: referenceKeys.length > 0 ? (translatedKeys.length / referenceKeys.length) * 100 : 0,
    averageKeyLength,
    averageValueLength,
    specialCharsCount,
    emptyValues,
    duplicateValues,
    longestKeys,
    longestValues,
    formattingIssues,
    valueTypes,
    stringLengths,
    htmlTags,
    variables,
    specialChars,
    wordStats,
    caseStats,
  }
}

function generateHtmlReport(report: StatsReport, outputPath: string) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translation Statistics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .locale { margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .progress-bar { background: #eee; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress { background: #4CAF50; height: 100%; transition: width 0.3s; }
        .warning { color: #f44336; }
        .success { color: #4CAF50; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Translation Statistics Report</h1>
        
        <div class="summary">
            <h2>Summary</h2>
            <div class="stats">
                <div class="stat-card">
                    <h3>Overall Statistics</h3>
                    <p>Total Locales: ${report.summary.totalLocales}</p>
                    <p>Total Files: ${report.summary.totalFiles}</p>
                    <p>Total Keys: ${report.summary.totalKeys}</p>
                    <p>Average Completion: ${report.summary.averageCompletion.toFixed(2)}%</p>
                </div>
                <div class="stat-card">
                    <h3>Completion by Locale</h3>
                    ${report.summary.localesByCompletion.map(locale => `
                        <div>
                            <p>${locale.code}: ${locale.completion.toFixed(2)}%</p>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${locale.completion}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        ${report.locales.map(locale => `
            <div class="locale">
                <h2>Locale: ${locale.code}</h2>
                
                <h3>Global Translations</h3>
                <div class="stats">
                    <div class="stat-card">
                        <h4>Basic Statistics</h4>
                        <p>Total Keys: ${locale.global.totalKeys}</p>
                        <p>Translated Keys: ${locale.global.translatedKeys}</p>
                        <p>Completion: ${locale.global.completion.toFixed(2)}%</p>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${locale.global.completion}%"></div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <h4>Length Analysis</h4>
                        <p>Average Key Length: ${locale.global.averageKeyLength.toFixed(2)}</p>
                        <p>Average Value Length: ${locale.global.averageValueLength.toFixed(2)}</p>
                        <p>Special Characters: ${locale.global.specialCharsCount}</p>
                    </div>
                </div>

                ${locale.global.duplicateValues.length > 0
    ? `
                    <div class="stat-card warning">
                        <h4>Duplicate Values</h4>
                        <ul>
                            ${locale.global.duplicateValues.map(dup => `<li>${dup}</li>`).join('')}
                        </ul>
                    </div>
                `
    : ''}

                ${locale.global.formattingIssues.length > 0
    ? `
                    <div class="stat-card warning">
                        <h4>Formatting Issues</h4>
                        <table>
                            <tr>
                                <th>Key</th>
                                <th>Issue</th>
                            </tr>
                            ${locale.global.formattingIssues.map(issue => `
                                <tr>
                                    <td>${issue.key}</td>
                                    <td>${issue.issue}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                `
    : ''}

                <h3>Page Translations</h3>
                ${Object.entries(locale.pages).map(([page, stats]) => `
                    <div class="stat-card">
                        <h4>${page}</h4>
                        <p>Total Keys: ${stats.totalKeys}</p>
                        <p>Translated Keys: ${stats.translatedKeys}</p>
                        <p>Completion: ${stats.completion.toFixed(2)}%</p>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${stats.completion}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </div>
</body>
</html>
  `

  fs.writeFileSync(outputPath, html)
}

export default defineCommand({
  meta: {
    name: 'stats',
    description: 'Display translation statistics for each locale',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    full: {
      type: 'boolean',
      description: 'Display detailed statistics',
      default: false,
    },
    html: {
      type: 'string',
      description: 'Generate HTML report to specified file',
      default: '',
    },
  },
  async run({ args }: { args: { cwd?: string, translationDir?: string, full?: boolean, html?: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())
    const { locales, translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)
    const translationDir = args.translationDir || defaultTranslationDir

    if (!fs.existsSync(translationDir)) {
      throw new Error('Translation directory does not exist')
    }

    const report: StatsReport = {
      locales: [],
      summary: {
        totalLocales: locales.length,
        totalFiles: 0,
        totalKeys: 0,
        averageCompletion: 0,
        localesByCompletion: [],
        mostTranslatedLocale: '',
        leastTranslatedLocale: '',
      },
    }

    // Load reference (default) locale for global translations
    const referenceLocale = locales[0].code
    let referenceGlobalTranslations: Record<string, any> = {}
    try {
      referenceGlobalTranslations = loadJsonFile(
        path.join(translationDir, `${referenceLocale}.json`),
      ) || {}
    }
    catch (error) {
      consola.error(`Failed to load reference translations: ${error}`)
      referenceGlobalTranslations = {}
    }
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
    report.summary.totalFiles = pagePaths.length + locales.length

    for (const locale of locales) {
      const { code } = locale
      const localeStats: LocaleStats = {
        code,
        global: {
          totalKeys: 0,
          translatedKeys: 0,
          completion: 0,
          averageKeyLength: 0,
          averageValueLength: 0,
          specialCharsCount: 0,
          emptyValues: 0,
          duplicateValues: [],
          longestKeys: [],
          longestValues: [],
          formattingIssues: [],
          valueTypes: {
            strings: 0,
            numbers: 0,
            booleans: 0,
            arrays: 0,
            objects: 0,
          },
          stringLengths: {
            short: 0,
            medium: 0,
            long: 0,
            veryLong: 0,
          },
          htmlTags: {
            count: 0,
            tags: [],
          },
          variables: {
            count: 0,
            examples: [],
          },
          specialChars: {
            punctuation: 0,
            emoji: 0,
            currency: 0,
            other: 0,
          },
          wordStats: {
            totalWords: 0,
            uniqueWords: 0,
            repeatedWords: [],
            averageWordLength: 0,
          },
          caseStats: {
            upperCase: 0,
            lowerCase: 0,
            titleCase: 0,
            mixedCase: 0,
          },
        },
        pages: {},
        combined: {
          totalKeys: 0,
          translatedKeys: 0,
          completion: 0,
          averageKeyLength: 0,
          averageValueLength: 0,
          specialCharsCount: 0,
          emptyValues: 0,
          duplicateValues: [],
          longestKeys: [],
          longestValues: [],
          formattingIssues: [],
          valueTypes: {
            strings: 0,
            numbers: 0,
            booleans: 0,
            arrays: 0,
            objects: 0,
          },
          stringLengths: {
            short: 0,
            medium: 0,
            long: 0,
            veryLong: 0,
          },
          htmlTags: {
            count: 0,
            tags: [],
          },
          variables: {
            count: 0,
            examples: [],
          },
          specialChars: {
            punctuation: 0,
            emoji: 0,
            currency: 0,
            other: 0,
          },
          wordStats: {
            totalWords: 0,
            uniqueWords: 0,
            repeatedWords: [],
            averageWordLength: 0,
          },
          caseStats: {
            upperCase: 0,
            lowerCase: 0,
            titleCase: 0,
            mixedCase: 0,
          },
        },
      }

      // Global translations statistics
      let globalTranslations: Record<string, any> = {}
      try {
        globalTranslations = loadJsonFile(path.join(translationDir, `${code}.json`)) || {}
      }
      catch (error) {
        consola.error(`Failed to load translations for ${code}: ${error}`)
        globalTranslations = {}
      }

      localeStats.global = analyzeTranslationStats(globalTranslations, referenceGlobalKeys)

      // Page-specific translations statistics
      for (const relativePath of pagePaths) {
        let referencePageTranslations: Record<string, any> = {}
        try {
          referencePageTranslations = loadJsonFile(path.join(translationDir, 'pages', relativePath.replace(`${referenceLocale}.json`, `${referenceLocale}.json`))) || {}
        }
        catch (error) {
          consola.error(`Failed to load reference page translations for ${relativePath}: ${error}`)
          referencePageTranslations = {}
        }
        const referencePageKeys = Object.keys(flattenTranslations(referencePageTranslations))

        const pageTranslationPath = path.join(translationDir, 'pages', relativePath.replace(`${referenceLocale}.json`, `${code}.json`))
        let pageTranslations: Record<string, any> = {}
        if (fs.existsSync(pageTranslationPath)) {
          try {
            pageTranslations = loadJsonFile(pageTranslationPath) || {}
          }
          catch (error) {
            consola.error(`Failed to load page translations for ${pageTranslationPath}: ${error}`)
            pageTranslations = {}
          }
        }

        localeStats.pages[relativePath] = analyzeTranslationStats(pageTranslations, referencePageKeys)
      }

      // Calculate combined statistics
      const allTranslations = { ...globalTranslations }
      for (const [page, translations] of Object.entries(localeStats.pages)) {
        allTranslations[page] = translations
      }
      localeStats.combined = analyzeTranslationStats(allTranslations, [...referenceGlobalKeys, ...pagePaths])

      report.locales.push(localeStats)
    }

    // Calculate summary statistics
    report.summary.totalKeys = report.locales.reduce((sum, locale) => sum + locale.combined.totalKeys, 0)
    report.summary.averageCompletion = report.locales.reduce((sum, locale) => sum + locale.combined.completion, 0) / locales.length
    report.summary.localesByCompletion = report.locales
      .map(locale => ({ code: locale.code, completion: locale.combined.completion }))
      .sort((a, b) => b.completion - a.completion)
    report.summary.mostTranslatedLocale = report.summary.localesByCompletion[0]?.code || ''
    report.summary.leastTranslatedLocale = report.summary.localesByCompletion[report.summary.localesByCompletion.length - 1]?.code || ''

    // Output results
    if (args.full) {
      for (const locale of report.locales) {
        consola.info(`\nLocale: ${locale.code}`)
        consola.info('Global Translations:')
        consola.info(`  Total Keys: ${locale.global.totalKeys}`)
        consola.info(`  Translated Keys: ${locale.global.translatedKeys}`)
        consola.info(`  Completion: ${locale.global.completion.toFixed(2)}%`)
        consola.info(`  Average Key Length: ${locale.global.averageKeyLength.toFixed(2)}`)
        consola.info(`  Average Value Length: ${locale.global.averageValueLength.toFixed(2)}`)
        consola.info(`  Special Characters: ${locale.global.specialCharsCount}`)
        consola.info(`  Empty Values: ${locale.global.emptyValues}`)

        if (locale.global.duplicateValues.length > 0) {
          consola.warn('  Duplicate Values:')
          locale.global.duplicateValues.forEach(dup => consola.warn(`    ${dup}`))
        }

        if (locale.global.formattingIssues.length > 0) {
          consola.warn('  Formatting Issues:')
          locale.global.formattingIssues.forEach(issue => consola.warn(`    ${issue.key}: ${issue.issue}`))
        }

        consola.info('\nValue Types:')
        consola.info(`  Strings: ${locale.global.valueTypes.strings}`)
        consola.info(`  Numbers: ${locale.global.valueTypes.numbers}`)
        consola.info(`  Booleans: ${locale.global.valueTypes.booleans}`)
        consola.info(`  Arrays: ${locale.global.valueTypes.arrays}`)
        consola.info(`  Objects: ${locale.global.valueTypes.objects}`)

        consola.info('\nString Lengths:')
        consola.info(`  Short (0-10): ${locale.global.stringLengths.short}`)
        consola.info(`  Medium (11-50): ${locale.global.stringLengths.medium}`)
        consola.info(`  Long (51-100): ${locale.global.stringLengths.long}`)
        consola.info(`  Very Long (>100): ${locale.global.stringLengths.veryLong}`)

        if (locale.global.htmlTags.count > 0) {
          consola.info('\nHTML Tags:')
          consola.info(`  Total Tags: ${locale.global.htmlTags.count}`)
          consola.info('  Most Used Tags:')
          locale.global.htmlTags.tags.slice(0, 5).forEach(({ tag, count }) => {
            consola.info(`    ${tag}: ${count}`)
          })
        }

        if (locale.global.variables.count > 0) {
          consola.info('\nVariables:')
          consola.info(`  Total Variables: ${locale.global.variables.count}`)
          consola.info('  Examples:')
          locale.global.variables.examples.slice(0, 5).forEach(({ key, variables }) => {
            consola.info(`    ${key}: ${variables.join(', ')}`)
          })
        }

        consola.info('\nSpecial Characters:')
        consola.info(`  Punctuation: ${locale.global.specialChars.punctuation}`)
        consola.info(`  Emoji: ${locale.global.specialChars.emoji}`)
        consola.info(`  Currency: ${locale.global.specialChars.currency}`)
        consola.info(`  Other: ${locale.global.specialChars.other}`)

        consola.info('\nWord Statistics:')
        consola.info(`  Total Words: ${locale.global.wordStats.totalWords}`)
        consola.info(`  Unique Words: ${locale.global.wordStats.uniqueWords}`)
        consola.info(`  Average Word Length: ${locale.global.wordStats.averageWordLength.toFixed(2)}`)
        if (locale.global.wordStats.repeatedWords.length > 0) {
          consola.info('  Most Repeated Words:')
          locale.global.wordStats.repeatedWords.slice(0, 5).forEach(({ word, count }) => {
            consola.info(`    ${word}: ${count} times`)
          })
        }

        consola.info('\nCase Statistics:')
        consola.info(`  Upper Case: ${locale.global.caseStats.upperCase}`)
        consola.info(`  Lower Case: ${locale.global.caseStats.lowerCase}`)
        consola.info(`  Title Case: ${locale.global.caseStats.titleCase}`)
        consola.info(`  Mixed Case: ${locale.global.caseStats.mixedCase}`)

        consola.info('\nPage Translations:')
        for (const [page, stats] of Object.entries(locale.pages)) {
          consola.info(`  ${page}:`)
          consola.info(`    Total Keys: ${stats.totalKeys}`)
          consola.info(`    Translated Keys: ${stats.translatedKeys}`)
          consola.info(`    Completion: ${stats.completion.toFixed(2)}%`)
        }

        consola.info('\nCombined Statistics:')
        consola.info(`  Total Keys: ${locale.combined.totalKeys}`)
        consola.info(`  Translated Keys: ${locale.combined.translatedKeys}`)
        consola.info(`  Completion: ${locale.combined.completion.toFixed(2)}%`)
      }

      consola.info('\nSummary:')
      consola.info(`Total Locales: ${report.summary.totalLocales}`)
      consola.info(`Total Files: ${report.summary.totalFiles}`)
      consola.info(`Total Keys: ${report.summary.totalKeys}`)
      consola.info(`Average Completion: ${report.summary.averageCompletion.toFixed(2)}%`)
      consola.info('Completion by Locale:')
      report.summary.localesByCompletion.forEach((locale) => {
        consola.info(`  ${locale.code}: ${locale.completion.toFixed(2)}%`)
      })
      consola.info(`Most Translated Locale: ${report.summary.mostTranslatedLocale}`)
      consola.info(`Least Translated Locale: ${report.summary.leastTranslatedLocale}`)
    }
    else {
      for (const locale of report.locales) {
        consola.info(`Combined translations: ${locale.code} - Total keys: ${locale.combined.totalKeys}, Translated keys: ${locale.combined.translatedKeys}, Completion: ${locale.combined.completion.toFixed(2)}%`)
      }
    }

    // Generate HTML report if requested
    if (args.html) {
      const outputPath = path.resolve(cwd, args.html)
      generateHtmlReport(report, outputPath)
      consola.success(`HTML report generated: ${outputPath}`)
    }
  },
})
