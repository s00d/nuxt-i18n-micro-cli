import { defineCommand } from 'citty'
import { consola } from 'consola'
import { sortProjectTranslations } from '../core/services/FormatService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'format',
    description: 'Format translation files by sorting keys and applying consistent indentation',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing translation files',
      default: 'locales',
    },
    indent: {
      type: 'string',
      description: 'Number of spaces for indentation',
      default: '2',
    },
    sortKeys: {
      type: 'boolean',
      description: 'Sort translation keys alphabetically',
      default: true,
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)

    if (args.sortKeys ?? true) {
      sortProjectTranslations(project)
      await project.save()
    }

    consola.success('Translation files have been formatted.')
  },
})
