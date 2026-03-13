import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import { consola } from 'consola'
import { ensureDirectoryExists } from '../core/utils/dir'
import { convertPoToJson } from '../core/utils/po'
import { resolveCommandContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'import',
    description: 'Convert PO files back to JSON format and save in translationDir',
  },
  args: {
    ...sharedArgs,
    potsDir: {
      type: 'string',
      description: 'Directory containing PO files',
      default: 'pots',
    },
    translationDir: {
      type: 'string',
      description: 'Directory to save JSON translation files',
      default: 'locales',
    },
  },
  async run({ args }) {
    const { translationDir } = await resolveCommandContext(args)

    const potsDir = resolve(args.potsDir)

    ensureDirectoryExists(translationDir)
    convertPoToJson(potsDir, translationDir)

    consola.log('PO files have been converted back to JSON and saved in the translation directory.')
  },
})
