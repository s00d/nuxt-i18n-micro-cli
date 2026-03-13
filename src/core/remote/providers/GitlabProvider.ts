import { Gitlab } from '@gitbeaker/rest'
import { toLocalLocale, toRemoteLocale } from '../utils/language-mapping'
import type { LocaleTranslations, RemoteConfig } from '../types'
import type { JsonObject } from '../../types'
import type { RemoteProvider } from '../RemoteProvider'

function resolveProjectPath(url: string): string {
  const parsed = new URL(url)
  const path = parsed.pathname.replace(/^\/+/, '')
  if (!path) {
    throw new Error('Invalid GitLab project URL in remote config')
  }
  return path
}

function resolveHost(url: string): string {
  const parsed = new URL(url)
  return `${parsed.protocol}//${parsed.host}`
}

export class GitlabProvider implements RemoteProvider {
  private readonly api: Gitlab

  constructor(private config: RemoteConfig) {
    this.api = new Gitlab({
      host: resolveHost(config.url),
      token: config.token,
    })
  }

  async pull(): Promise<LocaleTranslations> {
    const projectId = resolveProjectPath(this.config.url)
    const branch = this.config.branch || 'main'
    const basePath = this.config.path || 'translations'
    const tree = await this.api.Repositories.allRepositoryTrees(projectId, {
      path: basePath,
      recursive: true,
      ref: branch,
      perPage: 100,
    })
    const translations: LocaleTranslations = {}

    for (const item of tree) {
      if (item.type !== 'blob' || !item.path.endsWith('.json')) {
        continue
      }
      const file = await this.api.RepositoryFiles.show(projectId, item.path, branch)
      const encoded = typeof (file as { content?: unknown }).content === 'string'
        ? (file as { content: string }).content
        : ''
      const parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as JsonObject
      const remoteLocale = item.path.split('/').pop()!.replace('.json', '')
      const locale = toLocalLocale(remoteLocale, this.config.languageMapping)
      translations[locale] = parsed
    }

    return translations
  }

  async push(translations: LocaleTranslations): Promise<void> {
    const projectId = resolveProjectPath(this.config.url)
    const branch = this.config.branch || 'main'
    const basePath = this.config.path || 'translations'

    for (const [locale, content] of Object.entries(translations)) {
      const remoteLocale = toRemoteLocale(locale, this.config.languageMapping)
      const filePath = `${basePath}/${remoteLocale}.json`
      const body = JSON.stringify(content, null, 2)
      try {
        await this.api.RepositoryFiles.show(projectId, filePath, branch)
        await this.api.RepositoryFiles.edit(
          projectId,
          filePath,
          branch,
          body,
          `Update ${remoteLocale}.json translations`,
        )
      }
      catch {
        await this.api.RepositoryFiles.create(
          projectId,
          filePath,
          branch,
          body,
          `Add ${remoteLocale}.json translations`,
        )
      }
    }
  }
}
