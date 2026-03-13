import axios from 'axios'
import { LokaliseApi } from '@lokalise/node-api'
import type { LocaleTranslations, RemoteConfig } from '../types'
import { toRemoteLocale } from '../utils/language-mapping'
import { parseTranslationsFromZip } from '../utils/bundle'
import { waitForProcess } from '../utils/polling'
import type { RemoteProvider } from '../RemoteProvider'

function resolveProjectId(config: RemoteConfig): string {
  const projectId = config.projectId || config.path
  if (!projectId) {
    throw new Error('Lokalise provider requires project id in projectId (or path)')
  }
  return projectId
}

export class LokaliseProvider implements RemoteProvider {
  private readonly client: LokaliseApi

  constructor(private config: RemoteConfig) {
    this.client = new LokaliseApi({ apiKey: config.token || '' })
  }

  private async ensureProjectAccess(projectId: string): Promise<void> {
    await this.client.projects().get(projectId)
  }

  async pull(): Promise<LocaleTranslations> {
    const projectId = resolveProjectId(this.config)
    await this.ensureProjectAccess(projectId)

    const process = await this.client.files().async_download(projectId, {
      format: 'json',
      original_filenames: false,
      bundle_structure: '%LANG_ISO%.json',
    })

    const processInfo = await waitForProcess(
      () => this.client.queuedProcesses().get(process.process_id, { project_id: projectId }),
      value => value.status === 'finished' || value.status === 'failed',
      { intervalMs: this.config.pollIntervalMs, maxAttempts: this.config.pollMaxAttempts },
    )

    if (processInfo.status !== 'finished') {
      throw new Error(`Lokalise export failed with status: ${processInfo.status}`)
    }

    const details = processInfo.details as Record<string, unknown> | undefined
    const downloadUrl = typeof details?.download_url === 'string' ? details.download_url : ''
    if (!downloadUrl) {
      throw new Error('Lokalise export finished without download URL')
    }

    const zipBuffer = Buffer.from((await axios.get<ArrayBuffer>(downloadUrl, { responseType: 'arraybuffer' })).data)
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
    await this.ensureProjectAccess(projectId)

    for (const [locale, content] of Object.entries(translations)) {
      const remoteLocale = toRemoteLocale(locale, this.config.languageMapping)
      const data = Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
      const upload = await this.client.files().upload(projectId, {
        data,
        filename: `${remoteLocale}.json`,
        lang_iso: remoteLocale,
        replace_modified: true,
      })

      const processInfo = await waitForProcess(
        () => this.client.queuedProcesses().get(upload.process_id, { project_id: projectId }),
        value => value.status === 'finished' || value.status === 'failed',
        { intervalMs: this.config.pollIntervalMs, maxAttempts: this.config.pollMaxAttempts },
      )

      if (processInfo.status !== 'finished') {
        throw new Error(`Lokalise upload failed for locale ${locale} with status: ${processInfo.status}`)
      }
    }
  }
}
