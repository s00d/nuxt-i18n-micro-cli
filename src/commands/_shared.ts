import { existsSync } from 'node:fs'
import { resolve } from 'pathe'
import { consola } from 'consola'
import { cliNotFoundError, cliValidationError } from '../core/errors'
import { I18nProject } from '../core/Project'
import { getI18nConfig } from '../core/utils/kit'

export const sharedArgs = {
  cwd: {
    type: 'string',
    description: 'Current working directory',
  },
  logLevel: {
    type: 'string',
    description: 'Log level',
  },
} as const

interface SharedRunArgs {
  cwd?: string
  translationDir?: string
  logLevel?: string
}

export async function resolveCommandContext(args: SharedRunArgs) {
  const requestedCwd = resolve((args.cwd || '.').toString())
  const config = await getI18nConfig(requestedCwd, args.logLevel)
  const cwd = config.nuxtRoot
  const translationDir = args.translationDir || config.translationDir
  return {
    cwd,
    translationDir,
    config,
  }
}

export async function resolveProjectContext(args: SharedRunArgs) {
  const cwd = resolve((args.cwd || '.').toString())
  const project = await I18nProject.load(cwd, {
    logLevel: args.logLevel,
    translationDir: args.translationDir,
  })
  const translationDir = project.config.translationDir
  const config = {
    locales: project.config.locales,
    translationDir,
    defaultLocale: project.config.defaultLocale,
  }
  return {
    cwd,
    translationDir,
    config,
    project,
  }
}

export function parsePositiveIntArg(
  value: string | undefined,
  argName: string,
  defaultValue: number,
): number {
  const parsed = value ? Number.parseInt(value, 10) : defaultValue
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw cliValidationError(`${argName} must be a positive integer`, [
      `Example: --${argName} 10`,
    ])
  }
  return parsed
}

export function ensureTranslationDirExists(translationDir: string): void {
  if (!existsSync(translationDir)) {
    throw cliNotFoundError(`Translation directory "${translationDir}" does not exist`, [
      'Create the directory or set translationDir in nuxt.config / --translationDir.',
    ], {
      Path: translationDir,
    })
  }
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2))
}

export function printInfoRows(
  rows: Array<[label: string, value: unknown]>,
  indent = '',
): void {
  for (const [label, value] of rows) {
    consola.info(`${indent}${label}:`, value)
  }
}

export function printKeyValueLines(
  title: string,
  rows: Array<{ label: string, value: string | number }>,
  indent = '  ',
): void {
  consola.info(`\n${title}:`)
  for (const row of rows) {
    consola.info(`${indent}${row.label}: ${row.value}`)
  }
}

export function printCompletionStats(
  indent: string,
  stats: { totalKeys: number, translatedKeys: number, completion: number },
): void {
  consola.info(`${indent}Total Keys: ${stats.totalKeys}`)
  consola.info(`${indent}Translated Keys: ${stats.translatedKeys}`)
  consola.info(`${indent}Completion: ${stats.completion.toFixed(2)}%`)
}

export function printDependencyGroup(title: string, dependencies: object): void {
  const entries = Object.entries(dependencies)
  if (entries.length === 0) {
    return
  }

  consola.info(`\n  ${title}:`)
  entries.forEach(([name, version]) => {
    consola.info(`    - ${name}: ${String(version)}`)
  })
}
