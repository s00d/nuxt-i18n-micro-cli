import { defineCommand } from 'citty'
import { consola } from 'consola'
import { cliValidationError } from '../core/errors'
import { searchProjectTranslations } from '../core/services/SearchService'
import { printJson, resolveCommandContext, sharedArgs } from './_shared'
import { renderKeyValueTable, renderSection, renderStatus } from './_render'

function getDisplayKey(scope: string): string {
  if (scope === 'global') {
    return 'global'
  }
  return `pages/${scope}`
}

export default defineCommand({
  meta: {
    name: 'search',
    description: 'Search translation keys, values, usages, and hardcoded text',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    query: {
      type: 'positional',
      description: 'Text or translation key to search for',
      required: false,
    },
    caseSensitive: {
      type: 'boolean',
      description: 'Enable case-sensitive matching',
      default: false,
    },
    onlyUnused: {
      type: 'boolean',
      description: 'Show only keys without source usages',
      default: false,
    },
    preferUnused: {
      type: 'boolean',
      description: 'Rank unused keys above used keys',
      default: false,
    },
    scope: {
      type: 'string',
      description: 'Search scope: global, pages, all',
      default: 'all',
    },
    limit: {
      type: 'string',
      description: 'Limit number of returned keys',
    },
    hardcodedOnly: {
      type: 'boolean',
      description: 'Scan source for hardcoded text not found in translations',
      default: false,
    },
    onlyVue: {
      type: 'boolean',
      description: 'Scan only .vue files in source search',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Output as JSON',
      default: false,
    },
  },
  async run({ args }) {
    const { cwd, config } = await resolveCommandContext(args)
    const query = (args.query || '').toString().trim()
    if (!query && !args.hardcodedOnly) {
      throw cliValidationError('Search query cannot be empty unless --hardcodedOnly is enabled', [
        'Example: i18n-micro search "welcome"',
        'Or scan hardcoded text: i18n-micro search --hardcodedOnly',
      ])
    }
    const scope = ['global', 'pages', 'all'].includes(String(args.scope)) ? String(args.scope) as 'global' | 'pages' | 'all' : 'all'
    const limit = args.limit ? Number.parseInt(args.limit, 10) : undefined
    if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
      throw cliValidationError('limit must be a positive integer', [
        'Example: i18n-micro search "text" --limit 20',
      ])
    }

    const translationDirs = (config as { translationDirs?: string[] }).translationDirs || [config.translationDir]
    const result = await searchProjectTranslations({
      cwd,
      query,
      locales: config.locales,
      translationDirs,
      caseSensitive: Boolean(args.caseSensitive),
      onlyUnused: Boolean(args.onlyUnused),
      preferUnused: Boolean(args.preferUnused),
      hardcodedOnly: Boolean(args.hardcodedOnly),
      onlyVue: Boolean(args.onlyVue),
      scope,
      limit,
    })

    if (args.json) {
      printJson(result)
      return
    }

    if (result.matches.length === 0 && result.hardcoded.length === 0) {
      renderStatus('info', query
        ? `No matches found for "${query}"`
        : 'No matches found')
      return
    }

    for (const [index, match] of result.matches.entries()) {
      renderSection(`Match #${index + 1}`)
      renderKeyValueTable([
        ['Display key', getDisplayKey(match.scope)],
        ['Scope', match.scope],
        ['Translation key path', match.key],
        ['Used in source code', match.isUsed ? 'yes' : 'no'],
        ['Missing locales', match.missingLocales.length],
        ['Definitions found', match.translationLocations.length],
      ])

      consola.info('Translations by locale:')
      for (const locale of config.locales.map(locale => locale.code)) {
        const value = match.translations[locale]
        if (value) {
          consola.info(`  ${locale}: "${value}"`)
        }
        else {
          consola.warn(`  ${locale}: [Missing]`)
        }
      }

      consola.info('Translation file locations:')
      if (match.translationLocations.length === 0) {
        consola.info('  none')
      }
      for (const location of match.translationLocations) {
        consola.info(`  [${location.locale}] ${location.file}:${location.line}`)
      }

      consola.info('Source usages:')
      if (match.usages.length === 0) {
        consola.warn('  Not used in scanned source files')
      }
      for (const usage of match.usages) {
        consola.info(`  ${usage.file}:${usage.line} -> ${usage.content}`)
      }
    }

    if (result.hardcoded.length > 0) {
      renderSection('Hardcoded Text (Not localized)')
      for (const item of result.hardcoded) {
        consola.warn(`${item.file}:${item.line} -> ${item.content}`)
      }
    }

    renderStatus('success', 'Search completed')
  },
})
