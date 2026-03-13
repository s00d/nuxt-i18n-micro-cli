import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import { consola } from 'consola'
import { input, select } from '@inquirer/prompts'
import { parseOptions } from '../core/utils/json'
import translatorRegistry from '../core/translate/TranslatorRegistry'
import { loadGlossaryCatalog } from '../core/services/GlossaryService'
import { translateMissing } from '../core/services/TranslationService'
import { parsePositiveIntArg, resolveProjectContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'translate',
    description: 'Automatically translate missing keys using external translation services',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    service: {
      type: 'string',
      description: 'Translation service to use (e.g., google, deepl, yandex)',
      required: false,
    },
    token: {
      type: 'string',
      description: 'API key corresponding to the translation service',
      required: false,
    },
    options: {
      type: 'string',
      description: 'Additional options for the translation service in key:value pairs, separated by commas',
    },
    replace: {
      type: 'boolean',
      description: 'Translate all keys, replacing existing translations',
      default: false,
    },
    chunkSize: {
      type: 'string',
      description: 'Batch size for translation requests',
      required: false,
    },
    pluralSeparator: {
      type: 'string',
      description: 'Plural forms separator used in messages',
      default: '|',
      required: false,
    },
    glossaryFile: {
      type: 'string',
      description: 'Path to glossary file for terminology guidance',
      required: false,
    },
  },
  async run({ args }) {
    let service = args.service
    if (!service) {
      service = await select({
        message: 'Choose a translation service',
        choices: Object.keys(translatorRegistry).map(key => ({ name: key, value: key })),
      })
    }
    if (!service) {
      throw new Error('Translation service is required')
    }

    let token = args.token || ''
    if (!token) {
      token = await input({
        message: `Enter API key for ${service} (leave empty if not required)`,
      })
      token ||= ''
    }

    const options = (args.options ? parseOptions(args.options) : {}) as Record<string, unknown>
    if (args.pluralSeparator) {
      options.pluralSeparator = args.pluralSeparator
    }
    const chunkSize = parsePositiveIntArg(args.chunkSize, 'chunkSize', 50)

    const { project, cwd } = await resolveProjectContext(args)
    if (args.glossaryFile) {
      const glossaryPath = resolve(cwd, args.glossaryFile)
      options.glossaryCatalog = loadGlossaryCatalog(glossaryPath)
    }
    await translateMissing(project, {
      service,
      token,
      options,
      replace: args.replace,
      chunkSize,
    })
    await project.save()

    consola.success('Translations have been automatically processed.')
  },
})
