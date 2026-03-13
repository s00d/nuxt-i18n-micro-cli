import { defineCommand } from 'citty'
import { buildProjectDiff } from '../core/services/DiffService'
import { renderKeyValueTable, renderList, renderSection, renderStatus } from './_render'
import { printJson, resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'diff',
    description: 'Compares translation files between the default locale and other locales in the same directory, including subdirectories, showing missing keys and their values in the default locale.',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    json: {
      type: 'boolean',
      description: 'Output diff in JSON format',
      default: false,
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const diffResults = buildProjectDiff(project)

    if (args.json) {
      printJson(diffResults)
      return
    }

    if (diffResults.length === 0) {
      renderStatus('success', 'No missing translations found')
      return
    }

    const totalMissing = diffResults.reduce((acc, entry) => acc + (entry.missingInLocale?.length || 0), 0)
    renderSection('Translation Diff')
    renderKeyValueTable([
      ['Files with issues', diffResults.length],
      ['Missing keys', totalMissing],
    ])

    for (const entry of diffResults) {
      renderStatus('warn', `File: ${entry.file}`)
      renderList(
        'Missing entries',
        (entry.missingInLocale || []).map(item => `${item.key} -> ${item.defaultValue}`),
      )
    }
  },
})
