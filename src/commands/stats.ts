import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { buildStatsInput, buildStatsInputFromGitRef } from '../core/services/StatsService'
import {
  buildStatsDiff,
  buildStatsReport,
  generateStatsHtmlReport,
} from '../core/services/StatsReportService'
import {
  printCompletionStats,
  printJson,
  printKeyValueLines,
  resolveProjectContext,
  sharedArgs,
} from './_shared'
import { renderKeyValueTable, renderSection, renderStatus } from './_render'

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
    json: {
      type: 'boolean',
      description: 'Output statistics in JSON format',
      default: false,
    },
    baseRef: {
      type: 'string',
      description: 'Git reference for diff baseline (e.g. HEAD~1, main)',
      required: false,
    },
  },
  async run({ args }) {
    const { cwd, project } = await resolveProjectContext(args)
    const statsInput = buildStatsInput(project)
    const report = buildStatsReport(statsInput)
    let diff: ReturnType<typeof buildStatsDiff> | undefined

    if (args.baseRef) {
      const previousInput = buildStatsInputFromGitRef(project, args.baseRef)
      const previousReport = buildStatsReport(previousInput)
      diff = buildStatsDiff(report, previousReport, args.baseRef)
    }

    if (args.json) {
      let htmlReportPath: string | undefined
      if (args.html) {
        htmlReportPath = path.resolve(cwd, args.html)
        generateStatsHtmlReport(report, htmlReportPath)
      }
      printJson({
        ...report,
        diff,
        htmlReportPath,
      })
      return
    }

    // Output results
    if (args.full) {
      renderSection('Translation Statistics')
      for (const locale of report.locales) {
        renderStatus('info', `Locale: ${locale.code}`)
        consola.info('Global Translations:')
        printCompletionStats('  ', locale.global)
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

        printKeyValueLines('Value Types', [
          { label: 'Strings', value: locale.global.valueTypes.strings },
          { label: 'Numbers', value: locale.global.valueTypes.numbers },
          { label: 'Booleans', value: locale.global.valueTypes.booleans },
          { label: 'Arrays', value: locale.global.valueTypes.arrays },
          { label: 'Objects', value: locale.global.valueTypes.objects },
        ])

        printKeyValueLines('String Lengths', [
          { label: 'Short (0-10)', value: locale.global.stringLengths.short },
          { label: 'Medium (11-50)', value: locale.global.stringLengths.medium },
          { label: 'Long (51-100)', value: locale.global.stringLengths.long },
          { label: 'Very Long (>100)', value: locale.global.stringLengths.veryLong },
        ])

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

        printKeyValueLines('Special Characters', [
          { label: 'Punctuation', value: locale.global.specialChars.punctuation },
          { label: 'Emoji', value: locale.global.specialChars.emoji },
          { label: 'Currency', value: locale.global.specialChars.currency },
          { label: 'Other', value: locale.global.specialChars.other },
        ])

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

        printKeyValueLines('Case Statistics', [
          { label: 'Upper Case', value: locale.global.caseStats.upperCase },
          { label: 'Lower Case', value: locale.global.caseStats.lowerCase },
          { label: 'Title Case', value: locale.global.caseStats.titleCase },
          { label: 'Mixed Case', value: locale.global.caseStats.mixedCase },
        ])

        consola.info('\nPage Translations:')
        for (const [page, stats] of Object.entries(locale.pages)) {
          consola.info(`  ${page}:`)
          printCompletionStats('    ', stats)
        }

        consola.info('\nCombined Statistics:')
        printCompletionStats('  ', locale.combined)
      }

      printKeyValueLines('Summary', [
        { label: 'Total Locales', value: report.summary.totalLocales },
        { label: 'Total Files', value: report.summary.totalFiles },
        { label: 'Total Keys', value: report.summary.totalKeys },
        { label: 'Average Completion', value: `${report.summary.averageCompletion.toFixed(2)}%` },
      ], '')
      consola.info('Completion by Locale:')
      report.summary.localesByCompletion.forEach((locale) => {
        consola.info(`  ${locale.code}: ${locale.completion.toFixed(2)}%`)
      })
      consola.info(`Most Translated Locale: ${report.summary.mostTranslatedLocale}`)
      consola.info(`Least Translated Locale: ${report.summary.leastTranslatedLocale}`)
    }
    else {
      renderSection('Completion Summary')
      renderKeyValueTable(report.locales.map(locale => [
        locale.code,
        `${locale.combined.translatedKeys}/${locale.combined.totalKeys} (${locale.combined.completion.toFixed(2)}%)`,
      ]))
      for (const locale of report.locales) {
        consola.info(`Combined translations: ${locale.code} - Total keys: ${locale.combined.totalKeys}, Translated keys: ${locale.combined.translatedKeys}, Completion: ${locale.combined.completion.toFixed(2)}%`)
      }

      if (diff) {
        renderSection(`Diff vs ${diff.baseRef}`)
        renderKeyValueTable(diff.locales.map(locale => [
          locale.code,
          `${locale.completionDelta >= 0 ? '+' : ''}${locale.completionDelta.toFixed(2)}%`,
        ]))
      }
    }

    // Generate HTML report if requested
    if (args.html) {
      const outputPath = path.resolve(cwd, args.html)
      generateStatsHtmlReport(report, outputPath)
      consola.success(`HTML report generated: ${outputPath}`)
    }
  },
})
