import fs from 'node:fs'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'
import consola from 'consola'
import glob from 'glob'
import { loadJsonFile } from '../utils/json'
import { FileProcessor } from '../utils/text_converner/file-processor'
import { sharedArgs } from './_shared'

function getFilesToProcess(targetDir: string, customPath?: string) {
  if (customPath) {
    const resolvedPath = resolve(targetDir, customPath)

    // Check if path exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Path does not exist: ${resolvedPath}`)
    }

    // If it's a directory, scan it recursively
    if (fs.statSync(resolvedPath).isDirectory()) {
      return glob.sync('**/*.{vue,js,ts}', {
        cwd: resolvedPath,
        absolute: true,
      })
    }

    // If it's a file, verify extension and return it
    const ext = resolvedPath.split('.').pop()?.toLowerCase()
    if (['vue', 'js', 'ts'].includes(ext || '')) {
      return [resolvedPath]
    }

    throw new Error(`Unsupported file type: ${resolvedPath}`)
  }

  // Default behavior: scan standard directories
  const includeDirs = ['pages', 'components', 'plugins', 'layouts']
  const filePatterns = ['**/*.vue', '**/*.js', '**/*.ts']

  return includeDirs.flatMap(dir =>
    filePatterns.flatMap(pattern =>
      glob.sync(`${dir}/${pattern}`, {
        cwd: targetDir,
        absolute: true,
      }),
    ),
  )
}

function flatToNested(translations: Map<string, any>) {
  const result: Record<string, any> = {}

  for (const [key, entry] of translations) {
    const parts = key.split('.')
    let current = result

    // Create nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part]
    }

    // Set the value
    const lastPart = parts[parts.length - 1]
    current[lastPart] = entry.value
  }

  return result
}

function mergeTranslations(existing: Record<string, any>, newTranslations: Map<string, any>) {
  const result = { ...existing }
  const nested = flatToNested(newTranslations)

  // Deep merge
  for (const [key, value] of Object.entries(nested)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = result[key] ? { ...result[key], ...value } : value
    }
    else {
      result[key] = value
    }
  }

  return result
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
  },
  async run({ args }: { args: { cwd?: string, translationFile?: string, logLevel?: string, dryRun: boolean, verbose: boolean, context: string, path: string } }) {
    const targetDir = resolve(args.cwd?.toString() || '.')
    const translationFile = resolve(args.translationFile || 'locales/en.json')

    let index = 0
    // Load translations
    const translations = loadJsonFile(translationFile)

    if (!translations || typeof translations !== 'object') {
      consola.error('Invalid translation file. Please check the format.')
      return
    }

    // Initialize processor
    const processor = new FileProcessor(translations, {
      dryRun: args.dryRun,
      verbose: args.verbose,
      context: args.context,
    })

    // Collect files to process
    const files = getFilesToProcess(targetDir, args.path)

    consola.info(`Found ${files.length} files to process.`)

    // Process files
    for (const file of files) {
      try {
        if (args.verbose) {
          consola.info(`Processing ${file}`)
        }

        const updatedContent = processor.processFile(file)

        if (!args.dryRun) {
          fs.writeFileSync(file, updatedContent, 'utf-8')
        }

        if (args.verbose) {
          consola.success(`Processed ${file}`)
        }
      }
      catch (error) {
        consola.error(`Error processing ${file}:`, error)
      }
    }

    // Handle new translations
    const newTranslations = processor.getNewTranslations()
    if (newTranslations.size > 0) {
      consola.info(`Found ${newTranslations.size} new translations.`)

      if (!args.dryRun) {
        // Update translation file with nested structure
        const merged = mergeTranslations(translations, newTranslations)

        fs.writeFileSync(
          translationFile,
          JSON.stringify(merged, null, 2),
          'utf-8',
        )

        consola.success('Updated translation file.')
      }
      else {
        consola.info('Dry run - no files were modified.')
        for (const [key, entry] of newTranslations) {
          index++
          consola.info(`[${index}] ${key}: "${entry.value}" (${entry.file}:${entry.line})`)
        }
      }
    }
    else {
      consola.info('No new translations found.')
    }
  },
})
