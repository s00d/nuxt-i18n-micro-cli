import { flatten, unflatten } from 'flat'
import type { I18nProject } from '../Project'
import type { JsonObject } from '../types'
import { collectProjectSourceFiles } from '../utils/source-files'
import { readTextFile, writeTextFile } from '../utils/file'

export interface RenameProjectKeyOptions {
  from: string
  to: string
  dryRun?: boolean
}

export interface RenameProjectKeyResult {
  localesUpdated: number
  localeReferencesUpdated: number
  sourceFilesUpdated: number
  sourceReplacements: number
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renameFlatKey(
  source: JsonObject,
  from: string,
  to: string,
): { found: boolean, updated: JsonObject } {
  const flat = flatten<Record<string, unknown>, Record<string, unknown>>(source, {
    delimiter: '.',
    safe: true,
  })

  if (!(from in flat)) {
    return { found: false, updated: source }
  }
  if (to in flat) {
    throw new Error(`Target key already exists: ${to}`)
  }

  const next = Object.fromEntries(
    Object.entries(flat).filter(([key]) => key !== from),
  ) as Record<string, unknown>
  next[to] = flat[from]
  const updated = unflatten(next, { delimiter: '.', object: true }) as JsonObject
  return { found: true, updated }
}

function updateLinkedRefs(
  source: JsonObject,
  from: string,
  to: string,
): { replacements: number, updated: JsonObject } {
  const flat = flatten<Record<string, unknown>, Record<string, unknown>>(source, {
    delimiter: '.',
    safe: true,
  })
  const pattern = new RegExp(`@:${escapeRegExp(from)}(?![\\w.])`, 'g')
  let replacements = 0
  const next = { ...flat }

  for (const [key, value] of Object.entries(next)) {
    if (typeof value !== 'string' || !value.includes(`@:${from}`)) {
      continue
    }
    const updatedValue = value.replace(pattern, () => {
      replacements += 1
      return `@:${to}`
    })
    next[key] = updatedValue
  }

  if (replacements === 0) {
    return { replacements: 0, updated: source }
  }

  const updated = unflatten(next, { delimiter: '.', object: true }) as JsonObject
  return { replacements, updated }
}

function replaceKeyInSource(content: string, from: string, to: string): { content: string, replacements: number } {
  const escapedFrom = escapeRegExp(from)
  const callPattern = new RegExp(
    `((?:\\$t|\\$tc|\\$te|\\bi18n\\.t|\\bi18n\\.tc|\\bi18n\\.te|\\bthis\\.\\$t|\\bthis\\.\\$tc|\\bthis\\.\\$te)\\s*\\(\\s*)(['"\`])${escapedFrom}\\2`,
    'g',
  )
  const linkPattern = new RegExp(`(@:)${escapedFrom}(?![\\w.])`, 'g')

  let replacements = 0
  let updated = content.replace(callPattern, (_match, prefix: string, quote: string) => {
    replacements += 1
    return `${prefix}${quote}${to}${quote}`
  })
  updated = updated.replace(linkPattern, (_match, prefix: string) => {
    replacements += 1
    return `${prefix}${to}`
  })

  return { content: updated, replacements }
}

export function renameProjectKey(project: I18nProject, options: RenameProjectKeyOptions): RenameProjectKeyResult {
  if (!options.from || !options.to) {
    throw new Error('Both source and target keys are required')
  }
  if (options.from === options.to) {
    throw new Error('Source and target keys must be different')
  }

  const dryRun = Boolean(options.dryRun)
  let localesUpdated = 0
  let localeReferencesUpdated = 0

  for (const localeCode of project.getLocaleCodes()) {
    const localeSet = project.getLocale(localeCode)
    let localeChanged = false

    const renamedGlobal = renameFlatKey(localeSet.global, options.from, options.to)
    const linkedGlobal = updateLinkedRefs(renamedGlobal.updated, options.from, options.to)
    if (renamedGlobal.found || linkedGlobal.replacements > 0) {
      localeChanged = true
      localeReferencesUpdated += linkedGlobal.replacements
      if (!dryRun) {
        localeSet.global = linkedGlobal.updated
      }
    }

    for (const pageScope of localeSet.getPageScopes()) {
      const pageSource = localeSet.pages[pageScope] ?? {}
      const renamedPage = renameFlatKey(pageSource, options.from, options.to)
      const linkedPage = updateLinkedRefs(renamedPage.updated, options.from, options.to)
      if (renamedPage.found || linkedPage.replacements > 0) {
        localeChanged = true
        localeReferencesUpdated += linkedPage.replacements
        if (!dryRun) {
          localeSet.pages[pageScope] = linkedPage.updated
        }
      }
    }

    if (localeChanged) {
      localesUpdated += 1
      if (!dryRun) {
        localeSet.isModified = true
      }
    }
  }

  let sourceFilesUpdated = 0
  let sourceReplacements = 0
  for (const filePath of collectProjectSourceFiles(project.config.cwd)) {
    const original = readTextFile(filePath)
    const replaced = replaceKeyInSource(original, options.from, options.to)
    if (replaced.replacements === 0) {
      continue
    }
    sourceFilesUpdated += 1
    sourceReplacements += replaced.replacements
    if (!dryRun) {
      writeTextFile(filePath, replaced.content)
    }
  }

  if (localesUpdated === 0 && sourceFilesUpdated === 0 && localeReferencesUpdated === 0) {
    throw new Error(`Key not found: ${options.from}`)
  }

  return {
    localesUpdated,
    localeReferencesUpdated,
    sourceFilesUpdated,
    sourceReplacements,
  }
}
