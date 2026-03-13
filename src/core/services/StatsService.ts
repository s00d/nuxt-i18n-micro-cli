import path from 'node:path'
import { execFileSync } from 'node:child_process'
import type { I18nProject } from '../Project'
import { isJsonObject, type JsonObject } from '../types'
import { flattenTranslations } from '../utils/json'
import { buildLocaleFilePath, buildPagesDirectoryPath } from '../utils/translation-paths'

export interface LocaleStatsInput {
  code: string
  global: JsonObject
  pages: Record<string, JsonObject>
  combined: JsonObject
}

export interface StatsInput {
  locales: LocaleStatsInput[]
  pageScopes: string[]
  referenceGlobalKeys: string[]
  referencePageKeys: Record<string, string[]>
  referenceCombinedKeys: string[]
  totalFiles: number
}

export function buildStatsInput(project: I18nProject): StatsInput {
  const referenceSet = project.getDefaultLocaleSet()
  const pageScopes = referenceSet.getPageScopes()
  const referenceGlobalKeys = Object.keys(referenceSet.getFlatGlobalKeys())
  const referencePageKeys: Record<string, string[]> = {}
  const referenceCombinedKeys = new Set<string>(referenceGlobalKeys)

  for (const pageScope of pageScopes) {
    const pageKeys = Object.keys(referenceSet.getFlatPageKeys(pageScope))
    referencePageKeys[pageScope] = pageKeys
    for (const key of pageKeys) {
      referenceCombinedKeys.add(`pages.${pageScope}.${key}`)
    }
  }

  const locales = project.config.locales.map((locale) => {
    const localeSet = project.getLocale(locale.code)
    return {
      code: locale.code,
      global: localeSet.global,
      pages: localeSet.pages,
      combined: {
        ...localeSet.global,
        pages: localeSet.pages,
      },
    }
  })

  return {
    locales,
    pageScopes,
    referenceGlobalKeys,
    referencePageKeys,
    referenceCombinedKeys: Array.from(referenceCombinedKeys),
    totalFiles: project.config.locales.length + (pageScopes.length * project.config.locales.length),
  }
}

function toGitPath(absolutePath: string, cwd: string): string {
  return path.relative(cwd, absolutePath).replaceAll(path.sep, '/')
}

function readJsonFromGitRef(cwd: string, baseRef: string, absolutePath: string): JsonObject | null {
  const gitPath = toGitPath(absolutePath, cwd)
  if (!gitPath || gitPath.startsWith('../')) {
    return null
  }
  try {
    const content = execFileSync(
      'git',
      ['show', `${baseRef}:${gitPath}`],
      { cwd, encoding: 'utf8' },
    )
    const parsed = JSON.parse(content) as unknown
    return isJsonObject(parsed) ? parsed : null
  }
  catch {
    return null
  }
}

function listPageScopesFromGitRef(cwd: string, baseRef: string, translationDir: string): string[] {
  const pagesDirPath = toGitPath(buildPagesDirectoryPath(translationDir), cwd)
  if (!pagesDirPath || pagesDirPath.startsWith('../')) {
    return []
  }

  try {
    const output = execFileSync(
      'git',
      ['ls-tree', '-r', '--name-only', baseRef, '--', pagesDirPath],
      { cwd, encoding: 'utf8' },
    )
    const scopes = new Set<string>()
    for (const line of output.split('\n').map(item => item.trim()).filter(Boolean)) {
      if (!line.endsWith('.json')) {
        continue
      }
      const parts = line.split('/')
      const pagesIndex = parts.indexOf('pages')
      if (pagesIndex === -1 || parts.length < pagesIndex + 3) {
        continue
      }
      const localeFile = parts[parts.length - 1] ?? ''
      if (!localeFile.endsWith('.json')) {
        continue
      }
      const scope = parts.slice(pagesIndex + 1, -1).join('/')
      if (scope) {
        scopes.add(scope)
      }
    }
    return Array.from(scopes)
  }
  catch {
    return []
  }
}

export function buildStatsInputFromGitRef(project: I18nProject, baseRef: string): StatsInput {
  const cwd = project.config.cwd
  const translationDir = path.resolve(cwd, project.config.translationDir)
  const currentPageScopes = project.getDefaultLocaleSet().getPageScopes()
  const gitPageScopes = listPageScopesFromGitRef(cwd, baseRef, translationDir)
  const pageScopes = Array.from(new Set([...currentPageScopes, ...gitPageScopes]))

  const locales = project.config.locales.map((locale) => {
    const globalPath = buildLocaleFilePath(translationDir, locale.code)
    const global = readJsonFromGitRef(cwd, baseRef, globalPath) ?? {}
    const pages: Record<string, JsonObject> = {}

    for (const pageScope of pageScopes) {
      const pagePath = path.join(buildPagesDirectoryPath(translationDir), pageScope, `${locale.code}.json`)
      pages[pageScope] = readJsonFromGitRef(cwd, baseRef, pagePath) ?? {}
    }

    return {
      code: locale.code,
      global,
      pages,
      combined: {
        ...global,
        pages,
      },
    }
  })

  const defaultLocale = project.config.defaultLocale
  const defaultLocaleEntry = locales.find(locale => locale.code === defaultLocale)
  const defaultGlobal = defaultLocaleEntry?.global ?? {}
  const referenceGlobalKeys = Object.keys(flattenTranslations(defaultGlobal))
  const referenceCombinedKeys = new Set<string>(referenceGlobalKeys)
  const referencePageKeys: Record<string, string[]> = {}

  for (const pageScope of pageScopes) {
    const pageValues = defaultLocaleEntry?.pages[pageScope] ?? {}
    const pageKeys = Object.keys(flattenTranslations(pageValues))
    referencePageKeys[pageScope] = pageKeys
    for (const key of pageKeys) {
      referenceCombinedKeys.add(`pages.${pageScope}.${key}`)
    }
  }

  return {
    locales,
    pageScopes,
    referenceGlobalKeys,
    referencePageKeys,
    referenceCombinedKeys: Array.from(referenceCombinedKeys),
    totalFiles: project.config.locales.length + (pageScopes.length * project.config.locales.length),
  }
}
