import { defineCommand } from 'citty'
import { consola } from 'consola'
import { generatePseudoLocale } from '../core/services/PseudoService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'pseudo',
    description: 'Generate pseudo-locale from a source locale',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing translation files',
      default: 'locales',
    },
    sourceLocale: {
      type: 'string',
      description: 'Source locale code (defaults to project default locale)',
      required: false,
    },
    targetLocale: {
      type: 'string',
      description: 'Target locale code for pseudo translations',
      required: true,
    },
    replace: {
      type: 'boolean',
      description: 'Replace existing values in target locale',
      default: false,
    },
  },
  async run({ args }) {
    const { project } = await resolveProjectContext(args)
    const sourceLocale = args.sourceLocale || project.config.defaultLocale
    const result = generatePseudoLocale(project, {
      sourceLocale,
      targetLocale: args.targetLocale,
      replace: args.replace,
    })

    await project.save()
    consola.success(`Pseudo locale generated: ${result.sourceLocale} -> ${result.targetLocale}`)
    consola.info(`Updated keys: ${result.updatedKeys}, skipped keys: ${result.skippedKeys}`)
  },
})
