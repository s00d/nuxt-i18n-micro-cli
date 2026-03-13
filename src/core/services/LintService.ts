import path from 'node:path'
import { collectFilesRecursive, pathExists } from '../utils/dir'
import { copyFile } from '../utils/file'
import { flattenKeyValueEntries, loadJsonFile, setNestedValue, writeJsonFile } from '../utils/json'
import {
  buildLocaleFilePath,
  buildPagesDirectoryPath,
  getLocaleCodeFromLocaleFilePath,
} from '../utils/translation-paths'

export interface LintRule {
  name: string
  description: string
  check: (value: string, context: { key: string, locale: string, file: string }) => boolean
  message: (value: string, context: { key: string, locale: string, file: string }) => string
  fix?: (value: string) => string
}

export interface LintResult {
  file: string
  locale: string
  key: string
  value: string
  rule: string
  message: string
  fixedValue?: string
}

export interface LintRegexRuleConfig {
  name: string
  pattern: string
  flags?: string
  description?: string
  replacement?: string
}

export interface LintConfig {
  enabledRules?: string[]
  disabledRules?: string[]
  customRegexRules?: LintRegexRuleConfig[]
}

export const lintRules: LintRule[] = [
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

export function loadLintConfig(cwd: string): LintConfig {
  const configPath = path.join(cwd, '.i18n-lintrc.json')
  if (!pathExists(configPath)) {
    return {}
  }

  const rawConfig = loadJsonFile(configPath)
  const enabledRules = Array.isArray(rawConfig.enabledRules)
    ? rawConfig.enabledRules.filter(item => typeof item === 'string')
    : undefined
  const disabledRules = Array.isArray(rawConfig.disabledRules)
    ? rawConfig.disabledRules.filter(item => typeof item === 'string')
    : undefined
  const customRegexRules = Array.isArray(rawConfig.customRegexRules)
    ? rawConfig.customRegexRules
        .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
        .flatMap((item) => {
          if (typeof item.name !== 'string' || typeof item.pattern !== 'string') {
            return []
          }
          return [{
            name: item.name,
            pattern: item.pattern,
            flags: typeof item.flags === 'string' ? item.flags : undefined,
            description: typeof item.description === 'string' ? item.description : undefined,
            replacement: typeof item.replacement === 'string' ? item.replacement : undefined,
          }]
        })
    : undefined

  return {
    enabledRules,
    disabledRules,
    customRegexRules,
  }
}

export function buildCustomRegexRules(config: LintConfig): LintRule[] {
  return (config.customRegexRules ?? []).flatMap((ruleConfig) => {
    try {
      const matcher = new RegExp(ruleConfig.pattern, ruleConfig.flags)
      return [{
        name: ruleConfig.name,
        description: ruleConfig.description ?? `Regex rule: ${ruleConfig.pattern}`,
        check: value => !matcher.test(value),
        message: (_value, { key, locale, file }) =>
          `Custom lint rule "${ruleConfig.name}" failed in file ${file} for key ${key} (${locale})`,
        fix: ruleConfig.replacement
          ? value => value.replace(matcher, ruleConfig.replacement ?? '')
          : undefined,
      }]
    }
    catch {
      return []
    }
  })
}

function checkTranslations(
  translations: Record<string, unknown>,
  rules: LintRule[],
  context: { file: string, locale: string, results: LintResult[] },
) {
  for (const [fullKey, value] of flattenKeyValueEntries(translations)) {
    if (typeof value !== 'string') {
      continue
    }
    const ruleContext = { ...context, key: fullKey }
    for (const rule of rules) {
      if (!rule.check(value, ruleContext)) {
        context.results.push({
          file: context.file,
          locale: context.locale,
          key: fullKey,
          value,
          rule: rule.name,
          message: rule.message(value, ruleContext),
        })
      }
    }
  }
}

function collectPageFilesByLocale(
  translationDir: string,
  localeCodes: string[],
): Map<string, string[]> {
  const pagesDir = buildPagesDirectoryPath(translationDir)
  const byLocale = new Map<string, string[]>()

  for (const localeCode of localeCodes) {
    byLocale.set(localeCode, [])
  }

  const localeCodeSet = new Set(localeCodes)
  const pageFiles = collectFilesRecursive(
    pagesDir,
    (_fullPath, entry) => entry.name.endsWith('.json'),
  )

  for (const pageFile of pageFiles) {
    const localeCode = getLocaleCodeFromLocaleFilePath(pageFile)
    if (!localeCode || !localeCodeSet.has(localeCode)) {
      continue
    }
    byLocale.get(localeCode)?.push(pageFile)
  }

  return byLocale
}

export function collectLintResults(params: {
  translationDir: string
  locales: Array<{ code: string }>
  rulesToCheck: LintRule[]
}): LintResult[] {
  const results: LintResult[] = []
  const localeCodes = params.locales.map(locale => locale.code)
  const pageFilesByLocale = collectPageFilesByLocale(params.translationDir, localeCodes)

  for (const locale of params.locales) {
    const filePath = buildLocaleFilePath(params.translationDir, locale.code)
    if (!pathExists(filePath)) {
      continue
    }

    const translations = loadJsonFile(filePath)
    checkTranslations(translations, params.rulesToCheck, {
      file: filePath,
      locale: locale.code,
      results,
    })

    const pageFiles = pageFilesByLocale.get(locale.code) ?? []
    for (const pageFile of pageFiles) {
      const pageTranslations = loadJsonFile(pageFile)
      checkTranslations(pageTranslations, params.rulesToCheck, {
        file: pageFile,
        locale: locale.code,
        results,
      })
    }
  }

  return results
}

export function applyLintFixes(params: {
  results: LintResult[]
  rulesToCheck: LintRule[]
}): { fixedCount: number } {
  const fileResultsMap = new Map<string, LintResult[]>()
  for (const result of params.results) {
    const fileResults = fileResultsMap.get(result.file) || []
    fileResults.push(result)
    fileResultsMap.set(result.file, fileResults)
  }

  let fixedCount = 0
  for (const [file, fileResults] of fileResultsMap) {
    const translations = loadJsonFile(file)
    let hasChanges = false

    for (const result of fileResults) {
      const rule = params.rulesToCheck.find(r => r.name === result.rule)
      if (rule?.fix) {
        const fixedValue = rule.fix(result.value)
        if (fixedValue !== result.value) {
          setNestedValue(translations, result.key, fixedValue)
          hasChanges = true
          fixedCount++
        }
      }
    }

    if (hasChanges) {
      const backupPath = `${file}.bak`
      copyFile(file, backupPath)
      writeJsonFile(file, translations)
    }
  }

  return { fixedCount }
}
