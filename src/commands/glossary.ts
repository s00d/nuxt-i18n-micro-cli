import { defineCommand } from 'citty'
import { cliUsageError, cliValidationError } from '../core/errors'
import { resolve } from 'pathe'
import { consola } from 'consola'
import {
  addGlossaryEntry,
  loadGlossaryCatalog,
  removeGlossaryEntry,
  saveGlossaryCatalog,
} from '../core/services/GlossaryService'
import { sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'glossary',
    description: 'Manage glossary terms used by translation workflows',
  },
  args: {
    ...sharedArgs,
    file: {
      type: 'string',
      description: 'Path to glossary file',
      default: '.i18n-glossary.json',
    },
    action: {
      type: 'string',
      description: 'Action: list | add | remove',
      default: 'list',
    },
    source: {
      type: 'string',
      description: 'Source term',
      required: false,
    },
    target: {
      type: 'string',
      description: 'Target term',
      required: false,
    },
    from: {
      type: 'string',
      description: 'Source locale code (optional)',
      required: false,
    },
    to: {
      type: 'string',
      description: 'Target locale code (optional)',
      required: false,
    },
    json: {
      type: 'boolean',
      description: 'Print output as JSON',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = resolve(args.cwd || '.')
    const glossaryFile = resolve(cwd, args.file || '.i18n-glossary.json')
    const action = (args.action || 'list').toLowerCase()
    const catalog = loadGlossaryCatalog(glossaryFile)

    if (action === 'list') {
      if (args.json) {
        console.log(JSON.stringify(catalog, null, 2))
        return
      }
      if (catalog.entries.length === 0) {
        consola.info('Glossary is empty.')
        return
      }
      consola.info(`Glossary entries (${catalog.entries.length}):`)
      for (const entry of catalog.entries) {
        const pair = entry.from || entry.to ? ` [${entry.from || '*'} -> ${entry.to || '*'}]` : ''
        consola.info(`- ${entry.source} => ${entry.target}${pair}`)
      }
      return
    }

    if (action === 'add') {
      if (!args.source || !args.target) {
        throw cliValidationError('source and target are required for action=add', [
          'Example: i18n-micro glossary --action add --source Hello --target Привет',
        ])
      }
      addGlossaryEntry(catalog, {
        source: args.source,
        target: args.target,
        from: args.from,
        to: args.to,
      })
      saveGlossaryCatalog(glossaryFile, catalog)
      consola.success('Glossary entry added.')
      return
    }

    if (action === 'remove') {
      if (!args.source) {
        throw cliValidationError('source is required for action=remove', [
          'Example: i18n-micro glossary --action remove --source Hello',
        ])
      }
      const removed = removeGlossaryEntry(catalog, {
        source: args.source,
        from: args.from,
        to: args.to,
      })
      saveGlossaryCatalog(glossaryFile, catalog)
      if (removed > 0) {
        consola.success(`Removed ${removed} glossary entr${removed === 1 ? 'y' : 'ies'}.`)
      }
      else {
        consola.warn('No matching glossary entries found.')
      }
      return
    }

    throw cliUsageError(`Unsupported glossary action: ${action}`, [
      'Supported actions: list, add, remove',
    ])
  },
})
