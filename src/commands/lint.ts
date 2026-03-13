import { defineCommand } from 'citty'
import { consola } from 'consola'
import {
  applyLintFixes,
  buildCustomRegexRules,
  collectLintResults,
  lintRules,
  loadLintConfig,
} from '../core/services/LintService'
import { renderKeyValueTable, renderSection, renderStatus } from './_render'
import { ensureTranslationDirExists, printJson, resolveCommandContext, sharedArgs } from './_shared'

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
    },
    fix: {
      type: 'boolean',
      description: 'Automatically fix found issues',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Output lint results in JSON format',
      default: false,
    },
  },
  async run({ args }) {
    const { translationDir, config, cwd } = await resolveCommandContext(args)

    ensureTranslationDirExists(translationDir)

    const lintConfig = loadLintConfig(cwd)
    const availableRules = [
      ...lintRules,
      ...buildCustomRegexRules(lintConfig),
    ]

    // Get list of rules to check (CLI > config.enabledRules > all)
    const enabledRules = args.rules
      ? args.rules.split(',').map(name => name.trim())
      : lintConfig.enabledRules && lintConfig.enabledRules.length > 0
        ? lintConfig.enabledRules
        : availableRules.map(rule => rule.name)
    const disabledRules = new Set(lintConfig.disabledRules ?? [])
    const finalRuleNames = enabledRules.filter(name => !disabledRules.has(name))

    const rulesToCheck = availableRules.filter(rule => finalRuleNames.includes(rule.name))

    if (rulesToCheck.length === 0) {
      renderStatus('warn', 'No rules to check')
      return
    }

    renderSection('Lint Summary')
    renderStatus('info', 'Starting translation check')
    consola.info(`Active rules: ${rulesToCheck.map(rule => rule.name).join(', ')}`)

    const results = collectLintResults({
      translationDir,
      locales: config.locales,
      rulesToCheck,
    })
    let fixedCount = 0

    // Output results
    if (results.length === 0) {
      if (args.json) {
        printJson({
          rulesChecked: rulesToCheck.map(rule => rule.name),
          issueCount: 0,
          fixedCount,
          fixApplied: Boolean(args.fix),
          issues: [],
        })
      }
      renderStatus('success', 'Check completed. No issues found')
      return
    }

    renderStatus('warn', `Found ${results.length} issues`)
    renderKeyValueTable([
      ['Rules Checked', rulesToCheck.length],
      ['Issues Found', results.length],
    ])
    results.forEach((result) => {
      consola.warn(`[${result.rule}] ${result.message}`)
    })

    if (args.fix) {
      renderStatus('info', 'Starting automatic fixes')

      const applied = applyLintFixes({
        results,
        rulesToCheck,
      })
      fixedCount = applied.fixedCount

      if (fixedCount > 0) {
        renderStatus('success', `Fixed ${fixedCount} issues automatically`)
        consola.info('Backup files were created with .bak extension')
      }
      else {
        renderStatus('info', 'No issues could be fixed automatically')
      }
    }

    if (args.json) {
      printJson({
        rulesChecked: rulesToCheck.map(rule => rule.name),
        issueCount: results.length,
        fixedCount,
        fixApplied: Boolean(args.fix),
        issues: results,
      })
    }

    if (results.length > 0 && !args.fix) {
      throw new Error(`Found ${results.length} issues that need to be fixed`)
    }
  },
})
