import { defineCommand } from 'citty'
import { consola } from 'consola'
import { extractTranslations } from '../core/utils/components'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'clean',
    description: 'Remove unused and empty translation keys from translation files',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    include: {
      type: 'string',
      description: 'Regular expression to include only matching keys',
      required: false,
    },
    exclude: {
      type: 'string',
      description: 'Regular expression to exclude matching keys',
      required: false,
    },
  },
  async run({ args }) {
    const { cwd, project } = await resolveProjectContext(args)

    const translationData = extractTranslations(cwd)
    const usedGlobalKeys = new Set(Array.from(translationData.global))
    const usedPageSpecificKeys = Object.entries(translationData.pageSpecific).reduce((acc, [page, keys]) => {
      acc[page] = new Set(Array.from(keys))
      return acc
    }, {} as Record<string, Set<string>>)

    const includeRegex = args.include ? new RegExp(args.include) : null
    const excludeRegex = args.exclude ? new RegExp(args.exclude) : null

    const shouldKeepKey = (key: string): boolean => {
      if (includeRegex && !includeRegex.test(key)) {
        return false
      }
      if (excludeRegex && excludeRegex.test(key)) {
        return false
      }
      return true
    }

    project.cleanUnused(usedGlobalKeys, usedPageSpecificKeys, shouldKeepKey)
    await project.save()
    consola.success('Cleaned unused translations')
  },
})
