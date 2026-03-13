import { Octokit } from 'octokit'
import { toLocalLocale, toRemoteLocale } from '../utils/language-mapping'
import type { LocaleTranslations, RemoteConfig } from '../types'
import type { JsonObject } from '../../types'
import type { RemoteProvider } from '../RemoteProvider'

interface RepoCoordinates {
  owner: string
  repo: string
}

function parseGithubRepo(url: string): RepoCoordinates {
  const parsed = new URL(url)
  const [owner, repo] = parsed.pathname.split('/').filter(Boolean)
  if (!owner || !repo) {
    throw new Error('Invalid GitHub repository URL in remote config')
  }
  return { owner, repo }
}

export class GithubProvider implements RemoteProvider {
  private readonly octokit: Octokit

  constructor(private config: RemoteConfig) {
    this.octokit = new Octokit({ auth: config.token })
  }

  async pull(): Promise<LocaleTranslations> {
    const { owner, repo } = parseGithubRepo(this.config.url)
    const branch = this.config.branch || 'main'
    const folderPath = this.config.path || 'translations'

    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path: folderPath,
      ref: branch,
    })
    const files = Array.isArray(response.data) ? response.data : [response.data]
    const translations: LocaleTranslations = {}

    for (const file of files) {
      if (file.type !== 'file' || !file.name.endsWith('.json')) {
        continue
      }
      const fileContent = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path,
        ref: branch,
      })
      if (Array.isArray(fileContent.data) || fileContent.data.type !== 'file') {
        continue
      }
      const encoded = fileContent.data.content || ''
      const parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as JsonObject
      const remoteLocale = file.name.replace('.json', '')
      const locale = toLocalLocale(remoteLocale, this.config.languageMapping)
      translations[locale] = parsed
    }

    return translations
  }

  async push(translations: LocaleTranslations): Promise<void> {
    const { owner, repo } = parseGithubRepo(this.config.url)
    const branch = this.config.branch || 'main'
    const folderPath = this.config.path || 'translations'

    for (const [locale, content] of Object.entries(translations)) {
      const remoteLocale = toRemoteLocale(locale, this.config.languageMapping)
      const filePath = `${folderPath}/${remoteLocale}.json`
      const message = `Update ${remoteLocale}.json translations`
      const serialized = JSON.stringify(content, null, 2)
      const encoded = Buffer.from(serialized).toString('base64')

      let sha: string | undefined
      try {
        const existing = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branch,
        })
        if (!Array.isArray(existing.data) && existing.data.type === 'file') {
          sha = existing.data.sha
        }
      }
      catch {
        // File doesn't exist, createOrUpdate without sha.
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        branch,
        message,
        content: encoded,
        sha,
      })
    }
  }
}
