import { defu } from 'defu'
import { cliCommandFailedError, cliRemoteConfigError, cliValidationError } from '../errors'
import { flattenTranslations, parseJsonFile, saveJsonFile } from '../utils/json'
import { pathExists } from '../utils/dir'
import { buildLocaleFilePath, buildRemoteConfigPath } from '../utils/translation-paths'
import type { I18nProject } from '../Project'
import type { LocaleTranslations, RemoteConfig } from '../remote/types'
import { createRemoteProvider } from '../remote/createRemoteProvider'

export type { RemoteConfig }

export interface RemoteSyncOptions {
  pull: boolean
  push: boolean
  force: boolean
  dryRun: boolean
}

export interface RemoteSyncConflict {
  key: string
  local: unknown
  remote: unknown
}

export interface RemoteSyncResult {
  added: string[]
  updated: string[]
  deleted: string[]
  conflicts: RemoteSyncConflict[]
  errors: Array<{ file: string, error: string }>
  dryRun: boolean
}

const DEFAULT_REMOTE_SYNC_OPTIONS: RemoteSyncOptions = {
  pull: true,
  push: false,
  force: false,
  dryRun: false,
}

async function loadRemoteConfig(cwd: string): Promise<RemoteConfig> {
  const configPath = buildRemoteConfigPath(cwd)
  if (!pathExists(configPath)) {
    throw cliRemoteConfigError('Remote configuration file not found.', [
      'Create .i18n-remote.json in the project root (see README sync-remote section).',
      'Example providers: github, gitlab, crowdin, lokalise, tolgee, weblate, custom',
    ], {
      Path: configPath,
    })
  }
  const config = parseJsonFile(configPath) as RemoteConfig
  if (!config.type || !config.url) {
    throw cliRemoteConfigError('Invalid remote configuration.', [
      'Ensure .i18n-remote.json includes "type" and "url" fields.',
    ], {
      Path: configPath,
    })
  }
  return config
}

function validateRemoteConfig(config: RemoteConfig): void {
  switch (config.type) {
    case 'github':
    case 'gitlab':
    case 'lokalise':
    case 'crowdin':
    case 'tolgee':
    case 'weblate':
      if (!config.token) {
        throw cliRemoteConfigError(`${config.type} token is required`, [
          `Add "token" to .i18n-remote.json for provider "${config.type}".`,
        ])
      }
      break
    case 'custom':
      if (!config.auth?.username || !config.auth?.password) {
        throw cliRemoteConfigError('Custom remote requires username and password', [
          'Add "auth": { "username": "...", "password": "..." } to .i18n-remote.json.',
        ])
      }
      break
  }

  try {
    new URL(config.url)
  }
  catch {
    throw cliValidationError('Invalid remote URL', [
      'Set a valid absolute URL in .i18n-remote.json ("url" field).',
    ], {
      URL: config.url,
    })
  }
}

function resolveConflicts(
  localTranslations: LocaleTranslations,
  remoteTranslations: LocaleTranslations,
  options: RemoteSyncOptions,
): { merged: LocaleTranslations, conflicts: RemoteSyncConflict[] } {
  const flatLocal = flattenTranslations(localTranslations)
  const flatRemote = flattenTranslations(remoteTranslations)
  const conflicts: RemoteSyncConflict[] = []

  for (const [key, remoteValue] of Object.entries(flatRemote)) {
    const localValue = flatLocal[key]
    if (localValue !== undefined && localValue !== remoteValue) {
      conflicts.push({ key, local: localValue, remote: remoteValue })
    }
  }

  if (conflicts.length > 0) {
    if (options.force) {
      return { merged: remoteTranslations, conflicts }
    }
    if (options.dryRun) {
      return { merged: localTranslations, conflicts }
    }
    throw cliCommandFailedError('Conflicts found between local and remote translations.', [
      'Resolve conflicts manually, or rerun with --force to prefer remote values.',
      'Preview without writing: i18n-micro sync-remote --dry-run',
    ])
  }

  return { merged: { ...localTranslations, ...remoteTranslations }, conflicts: [] }
}

export async function runRemoteSync(params: {
  cwd: string
  translationDir: string
  localeCodes: string[]
  project: I18nProject
  options?: Partial<RemoteSyncOptions>
}): Promise<RemoteSyncResult> {
  const options = defu(params.options ?? {}, DEFAULT_REMOTE_SYNC_OPTIONS)
  const remoteConfig = await loadRemoteConfig(params.cwd)
  validateRemoteConfig(remoteConfig)
  const provider = createRemoteProvider(remoteConfig)

  const result: RemoteSyncResult = {
    added: [],
    updated: [],
    deleted: [],
    conflicts: [],
    errors: [],
    dryRun: options.dryRun,
  }

  const localTranslations: LocaleTranslations = {}
  const existingLocales = new Set<string>()
  for (const code of params.localeCodes) {
    const filePath = buildLocaleFilePath(params.translationDir, code)
    if (pathExists(filePath)) {
      existingLocales.add(code)
    }
    localTranslations[code] = params.project.getLocale(code).global
  }

  let activeTranslations = localTranslations

  if (options.pull) {
    const remoteTranslations = await provider.pull()
    const { merged, conflicts } = resolveConflicts(localTranslations, remoteTranslations, options)
    activeTranslations = merged
    result.conflicts = conflicts

    if (!options.dryRun) {
      const localeCodes = params.project.getLocaleCodes()
      for (const [locale, translations] of Object.entries(merged)) {
        const filePath = buildLocaleFilePath(params.translationDir, locale)
        try {
          if (localeCodes.includes(locale)) {
            const localeSet = params.project.getLocale(locale)
            localeSet.global = translations
            localeSet.isModified = true
          }
          else {
            saveJsonFile(filePath, translations)
          }

          if (!existingLocales.has(locale)) {
            result.added.push(locale)
          }
          else {
            result.updated.push(locale)
          }
        }
        catch (error) {
          result.errors.push({ file: filePath, error: String(error) })
        }
      }
      await params.project.save()
    }
  }

  if (options.push) {
    await provider.push(activeTranslations)
  }

  return result
}
