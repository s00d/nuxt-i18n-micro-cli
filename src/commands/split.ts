import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { splitProjectTranslations } from '../core/services/SplitService'
import { parsePositiveIntArg, resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'split',
    description: 'Split large translation files into smaller ones based on specified criteria',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    maxKeys: {
      type: 'string',
      description: 'Maximum number of keys per file',
      default: '100',
    },
    maxDepth: {
      type: 'string',
      description: 'Maximum nesting depth for splitting',
      default: '2',
    },
    splitByPrefix: {
      type: 'boolean',
      description: 'Split files by key prefix',
      default: false,
    },
    outputDir: {
      type: 'string',
      description: 'Directory to save split translation files',
      default: 'locales/split',
    },
  },
  async run(context) {
    const args = context.args
    const { translationDir, project } = await resolveProjectContext(args)
    const outputDir = args.outputDir || path.join(translationDir, 'split')
    const maxKeys = parsePositiveIntArg(args.maxKeys, 'maxKeys', 100)
    const maxDepth = parsePositiveIntArg(args.maxDepth, 'maxDepth', 2)
    const summary = splitProjectTranslations(project, {
      outputDir,
      maxKeys,
      maxDepth,
      splitByPrefix: args.splitByPrefix ?? false,
    })

    for (const item of summary) {
      consola.success(`Split translations for locale ${item.locale} into ${item.parts} files`)
    }
  },
})
