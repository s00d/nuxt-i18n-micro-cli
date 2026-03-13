import { defineCommand } from 'citty'
import { consola } from 'consola'
import { validateProjectLocales } from '../core/services/ValidationService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'validate',
    description: 'Validate translation files for missing or extra keys',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const issues = validateProjectLocales(project)
    if (issues.length > 0) {
      for (const issue of issues) {
        if (issue.missingKeys.length > 0) {
          consola.warn(`Locale ${issue.locale} is missing keys:\n${issue.missingKeys.join('\n')}`)
        }
        if (issue.extraKeys.length > 0) {
          consola.warn(`Locale ${issue.locale} has extra keys:\n${issue.extraKeys.join('\n')}`)
        }
      }
      throw new Error('Validation failed with errors.')
    }

    consola.success('All translation files are valid.')
  },
})
