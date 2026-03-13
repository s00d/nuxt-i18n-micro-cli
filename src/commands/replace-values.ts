import { defineCommand } from 'citty'
import { consola } from 'consola'
import { replaceProjectValues } from '../core/services/ReplaceValuesService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'replace-values',
    description: 'Bulk replace translation values across all locales',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    search: {
      type: 'string',
      description: 'Text or regex pattern to search for',
      required: true,
    },
    replace: {
      type: 'string',
      description: 'Replacement text, can include regex group references',
      required: true,
    },
    useRegex: {
      type: 'boolean',
      description: 'Enable regex search for pattern matching',
      default: false,
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const updatedCount = replaceProjectValues(project, {
      search: args.search,
      replace: args.replace,
      useRegex: args.useRegex,
    })
    await project.save()

    consola.success(`Translation values have been updated. Changed keys: ${updatedCount}`)
  },
})
