import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import { loadKit } from '../utils/kit'
import { ensureDirectoryExists } from '../utils/dir'
import { convertPoToJson } from '../utils/po'
import { sharedArgs } from "./_shared";
import consola from "consola";

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
  async run({ args }: { args: { cwd?: string, potsDir: string, translationDir: string } }) {
    consola.log('Parsed args:', args)

    const cwd = resolve((args.cwd || '.').toString())
    const kit = await loadKit(cwd)
    const nuxt = await kit.loadNuxt({
      cwd,
      dotenv: { cwd },
    }) as any

    const translationDir = resolve(args.translationDir || nuxt.options.i18n.translationDir || 'locales')
    const potsDir = resolve(args.potsDir)

    ensureDirectoryExists(translationDir)
    convertPoToJson(potsDir, translationDir)

    consola.log('PO files have been converted back to JSON and saved in the translation directory.')
  },
})
