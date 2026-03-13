import axios from 'axios'
import { Client } from '@crowdin/crowdin-api-client'
import type { LocaleTranslations, RemoteConfig } from '../types'
import { toRemoteLocale } from '../utils/language-mapping'
import { createZipFromTranslations, parseTranslationsFromZip } from '../utils/bundle'
import { waitForProcess } from '../utils/polling'
import type { RemoteProvider } from '../RemoteProvider'

function resolveProjectId(config: RemoteConfig): number {
  const raw = config.projectId || config.path || ''
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Crowdin provider requires numeric project id in projectId (or path)')
  }
  return parsed
}

export class CrowdinProvider implements RemoteProvider {
  private readonly client: Client

  constructor(private config: RemoteConfig) {
    this.client = new Client({ token: config.token || '' })
  }

  async pull(): Promise<LocaleTranslations> {
    const projectId = resolveProjectId(this.config)
    const build = await this.client.translationsApi.buildProject(projectId, {
      targetLanguageIds: undefined,
      skipUntranslatedStrings: false,
      skipUntranslatedFiles: false,
    })
    const buildId = build.data.id

    const buildStatus = await waitForProcess(
      () => this.client.translationsApi.checkBuildStatus(projectId, buildId).then(res => res.data),
      status => status.status === 'finished' || status.status === 'failed' || status.status === 'canceled',
      { intervalMs: this.config.pollIntervalMs, maxAttempts: this.config.pollMaxAttempts },
    )

    if (buildStatus.status !== 'finished') {
      throw new Error(`Crowdin export build failed with status: ${buildStatus.status}`)
    }

    const download = await this.client.translationsApi.downloadTranslations(projectId, buildId)
    const bundleUrl = download.data.url
    const zipBuffer = Buffer.from((await axios.get<ArrayBuffer>(bundleUrl, { responseType: 'arraybuffer' })).data)
    return parseTranslationsFromZip(zipBuffer, (fileName) => {
      const base = fileName.split('/').pop()
      if (!base || !base.endsWith('.json')) {
        return null
      }
      const remoteLocale = base.replace('.json', '')
      return Object.entries(this.config.languageMapping ?? {}).find(([, remote]) => remote === remoteLocale)?.[0] ?? remoteLocale
    })
  }

  async push(translations: LocaleTranslations): Promise<void> {
    const projectId = resolveProjectId(this.config)
    const remoteTranslations = Object.fromEntries(
      Object.entries(translations).map(([locale, content]) => [
        toRemoteLocale(locale, this.config.languageMapping),
        content,
      ]),
    )
    const zipBuffer = await createZipFromTranslations(remoteTranslations)
    const storage = await this.client.uploadStorageApi.addStorage('translations.zip', zipBuffer, 'application/zip')
    const languageIds = Object.keys(remoteTranslations)

    const importResult = await this.client.translationsApi.importTranslations(projectId, {
      storageId: storage.data.id,
      languageIds,
    })
    const importId = String(importResult.data.identifier)

    const importStatus = await waitForProcess(
      () => this.client.translationsApi.importTranslationsStatus(projectId, importId).then(res => res.data),
      status => status.status === 'finished' || status.status === 'failed',
      { intervalMs: this.config.pollIntervalMs, maxAttempts: this.config.pollMaxAttempts },
    )

    if (importStatus.status !== 'finished') {
      throw new Error(`Crowdin import failed with status: ${importStatus.status}`)
    }
  }
}
