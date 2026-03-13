import path from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import {
  analyzeFiles,
  formatSize,
  runOptimization,
  updateTranslationPaths,
} from '../core/services/OptimizeService'
import { renderKeyValueTable, renderList, renderSection, renderStatus } from './_render'
import { ensureTranslationDirExists, parsePositiveIntArg, printJson, resolveCommandContext, sharedArgs } from './_shared'

export default defineCommand({
  meta: {
    name: 'optimize',
    description: 'Optimize translation files structure',
  },
  args: {
    ...sharedArgs,
    translationDir: {
      type: 'string',
      description: 'Directory containing JSON translation files',
      default: 'locales',
    },
    minSize: {
      type: 'string',
      description: 'Minimum file size in bytes to consider for optimization',
      default: '1024', // 1KB
    },
    maxDepth: {
      type: 'string',
      description: 'Maximum nesting depth for translation keys',
      default: '3',
    },
    dryRun: {
      type: 'boolean',
      description: 'Show optimization suggestions without making changes',
      default: false,
    },
    updatePaths: {
      type: 'boolean',
      description: 'Update translation paths in Vue and JS files after optimization',
      default: true,
    },
    json: {
      type: 'boolean',
      description: 'Output optimization analysis in JSON format (implies dry-run)',
      default: false,
    },
  },
  async run(context) {
    const args = context.args
    const { cwd, translationDir } = await resolveCommandContext(args)
    const minSize = parsePositiveIntArg(args.minSize, 'minSize', 1024)
    const maxDepth = parsePositiveIntArg(args.maxDepth, 'maxDepth', 3)

    ensureTranslationDirExists(translationDir)
    const { analysis } = await runOptimization({
      cwd,
      translationDir,
      minSize,
      maxDepth,
      updatePaths: false,
      dryRun: true,
    })

    if (args.json) {
      printJson({
        analysis,
        thresholds: { minSize, maxDepth },
        canOptimize: analysis.largeFiles.length > 0
          || analysis.deepNestingFiles.length > 0
          || analysis.duplicateKeysFiles.length > 0,
      })
      return
    }

    if (analysis.totalFiles === 0) {
      renderStatus('info', 'No translation files found')
      return
    }

    renderSection('Optimization Analysis')
    renderKeyValueTable([
      ['Total files', analysis.totalFiles],
      ['Total size', formatSize(analysis.totalSize)],
      ['Average file size', formatSize(analysis.averageSize)],
      [`Files over ${formatSize(minSize)}`, analysis.largeFiles.length],
      ['Files with deep nesting', analysis.deepNestingFiles.length],
      ['Files with duplicate keys', analysis.duplicateKeysFiles.length],
    ])

    if (analysis.largeFiles.length > 0) {
      renderList('Large files that could be split', analysis.largeFiles.map(
        file => `${path.relative(translationDir, file.path)} (${formatSize(file.size)})`,
      ))
    }

    if (analysis.deepNestingFiles.length > 0) {
      renderList('Files with deep nesting', analysis.deepNestingFiles.map(
        file => `${path.relative(translationDir, file.path)} (depth: ${file.maxDepth})`,
      ))
    }

    if (analysis.duplicateKeysFiles.length > 0) {
      renderList('Files with duplicate keys', analysis.duplicateKeysFiles.map(
        file => `${path.relative(translationDir, file.path)} (${file.duplicateKeys.length} duplicates)`,
      ))
    }

    if (args.dryRun) {
      renderStatus('info', 'Dry run mode: no changes were made')
      return
    }

    if (analysis.largeFiles.length > 0 || analysis.deepNestingFiles.length > 0 || analysis.duplicateKeysFiles.length > 0) {
      const confirmed = await consola.prompt('Do you want to apply optimizations?', {
        type: 'confirm',
      })
      if (!confirmed) {
        renderStatus('warn', 'Optimization cancelled')
        return
      }

      await runOptimization({
        cwd,
        translationDir,
        minSize,
        maxDepth,
        updatePaths: args.updatePaths ?? true,
        dryRun: false,
      })

      renderStatus('success', 'Optimization completed')
    }
    else {
      renderStatus('success', 'No optimizations needed')
    }
  },
})

export { analyzeFiles, updateTranslationPaths }
