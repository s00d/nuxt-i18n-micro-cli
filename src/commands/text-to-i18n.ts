import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import { consola } from 'consola'
import { input, select } from '@inquirer/prompts'
import { runTextToI18n } from '../core/services/TextToI18nService'
import { sharedArgs } from './_shared'

async function collectInteractiveDecisions(
  newTranslations: Map<string, { value: string, file?: string, line?: number }>,
): Promise<{ keyOverrides: Record<string, string>, skippedKeys: string[] }> {
  const keyOverrides: Record<string, string> = {}
  const skippedKeys: string[] = []
  const items = Array.from(newTranslations.entries())
  const reservedKeys = new Set(items.map(([key]) => key))

  for (const [currentKey, entry] of items) {
    const location = entry.file && entry.line ? `${entry.file}:${entry.line}` : entry.file || 'unknown'
    const action = await select({
      message: `[${location}] "${entry.value}" -> ${currentKey}`,
      choices: [
        { name: 'Accept', value: 'accept' },
        { name: 'Edit key', value: 'edit' },
        { name: 'Skip', value: 'skip' },
      ],
      default: 'accept',
    })

    if (action === 'skip') {
      skippedKeys.push(currentKey)
      reservedKeys.delete(currentKey)
      continue
    }

    if (action !== 'edit') {
      continue
    }

    while (true) {
      const editedKey = (await input({
        message: `Edit key for "${entry.value}"`,
        default: currentKey,
      })).trim()

      if (!editedKey) {
        consola.warn('Key cannot be empty.')
        continue
      }

      if (editedKey !== currentKey && reservedKeys.has(editedKey)) {
        consola.warn(`Key "${editedKey}" is already used in this run.`)
        continue
      }

      if (editedKey !== currentKey) {
        keyOverrides[currentKey] = editedKey
        reservedKeys.delete(currentKey)
        reservedKeys.add(editedKey)
      }
      break
    }
  }

  return { keyOverrides, skippedKeys }
}

export default defineCommand({
  meta: {
    name: 'text-to-i18n',
    description: 'Replace text in files with translation references',
  },
  args: {
    ...sharedArgs,
    translationFile: {
      type: 'string',
      description: 'Path to the JSON file containing translations',
      default: 'locales/en.json',
    },
    path: {
      type: 'string',
      description: 'Custom path to file or directory to process',
    },
    context: {
      type: 'string',
      description: 'Context prefix for translation keys',
    },
    dryRun: {
      type: 'boolean',
      description: 'Show changes without modifying files',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Show detailed processing information',
      default: false,
    },
    extractOnlyDirs: {
      type: 'string',
      description: 'Comma-separated directories where source files are not modified (extract-only mode)',
      default: 'plugins',
    },
    extractOnlyPatterns: {
      type: 'string',
      description: 'Comma-separated glob-like patterns for extract-only mode (e.g. **/*.plugin.ts,**/schemas/**/*.ts)',
      required: false,
    },
    interactive: {
      type: 'boolean',
      description: 'Interactively confirm/edit generated translation keys',
      default: false,
    },
  },
  async run({ args }) {
    const targetDir = resolve(args.cwd || '.')
    const translationFile = resolve(args.translationFile || 'locales/en.json')

    const extractOnlyDirectories = (args.extractOnlyDirs || 'plugins')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
    const extractOnlyPatterns = (args.extractOnlyPatterns || '')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)

    const baseParams = {
      cwd: targetDir,
      translationFile,
      verbose: args.verbose ?? false,
      context: args.context,
      customPath: args.path,
      extractOnlyDirectories,
      extractOnlyPatterns,
    }

    let keyOverrides: Record<string, string> = {}
    let skippedKeys: string[] = []
    let result = runTextToI18n({
      ...baseParams,
      dryRun: args.interactive ? true : (args.dryRun ?? false),
      keyOverrides,
      skippedKeys,
    })

    if (args.interactive && result.newTranslations.size > 0) {
      const decisions = await collectInteractiveDecisions(result.newTranslations)
      keyOverrides = decisions.keyOverrides
      skippedKeys = decisions.skippedKeys

      if (!args.dryRun) {
        result = runTextToI18n({
          ...baseParams,
          dryRun: false,
          keyOverrides,
          skippedKeys,
        })
      }
    }

    let index = 0
    consola.info(`Found ${result.files.length} files to process.`)
    const newTranslations = result.newTranslations
    if (newTranslations.size > 0) {
      consola.info(`Found ${newTranslations.size} new translations.`)
      if (args.dryRun) {
        consola.info('Dry run - no files were modified.')
        for (const [key, entry] of newTranslations) {
          index++
          consola.info(`[${index}] ${key}: "${entry.value}" (${entry.file}:${entry.line})`)
        }
      }
      else {
        consola.success('Updated translation file.')
      }
    }
    else {
      consola.info('No new translations found.')
    }
  },
})
