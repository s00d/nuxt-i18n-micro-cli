import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import { ensureDirectoryExists } from '../utils/dir'
import { convertPoToJson } from '../utils/po'
import { getI18nConfig } from '../utils/kit'
import { sharedArgs } from './_shared'

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
  async run({ args }: { args: { cwd?: string, potsDir: string, translationDir: string, logLevel?: string } }) {
    const cwd = resolve((args.cwd || '.').toString())

    const { translationDir: defaultTranslationDir } = await getI18nConfig(cwd, args.logLevel)

    const translationDir = args.translationDir || defaultTranslationDir

    const potsDir = resolve(args.potsDir)

    ensureDirectoryExists(translationDir)
    convertPoToJson(potsDir, translationDir)

    consola.log('PO files have been converted back to JSON and saved in the translation directory.')
  },
})
