import { defineCommand } from 'citty'
import { consola } from 'consola'
import { ensureDirectoryExists } from '../core/utils/dir'
import { extractTranslations } from '../core/utils/components'
import { applyExtractedKeys } from '../core/services/ExtractService'
import { resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'extract',
    description: 'Extract translations and organize them by scope',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    prod: {
      type: 'boolean',
      description: 'production mode',
      alias: 'p',
    },
  },
  async run({ args }) {
    const { cwd, translationDir, project } = await resolveProjectContext(args)

    ensureDirectoryExists(translationDir)

    const translationData = extractTranslations(cwd)
    for (const warning of translationData.warnings) {
      consola.warn(`Dynamic i18n key detected in ${warning.file}: ${warning.expression}`)
    }
    applyExtractedKeys(project, {
      global: translationData.global,
      pageSpecific: translationData.pageSpecific,
    })
    await project.save()

    consola.log('Locale-specific translations have been saved to JSON files.')
  },
})
