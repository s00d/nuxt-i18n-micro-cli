import type { JsonObject } from '../types'

export interface RemoteConfig {
  type: 'github' | 'gitlab' | 'custom' | 'lokalise' | 'crowdin' | 'tolgee' | 'weblate'
  url: string
  branch?: string
  token?: string
  path?: string
  projectId?: string
  languageMapping?: Record<string, string>
  pollIntervalMs?: number
  pollMaxAttempts?: number
  auth?: {
    username?: string
    password?: string
  }
}

export type LocaleTranslations = Record<string, JsonObject>
