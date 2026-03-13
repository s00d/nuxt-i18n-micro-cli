import { joinURL } from 'ufo'
import { isJsonObject, type JsonObject } from '../../types'
import type { LocaleTranslations, RemoteConfig } from '../types'
import { createAxiosInstance } from './http'
import type { RemoteProvider } from '../RemoteProvider'

function resolveProjectId(config: RemoteConfig): string {
  return config.projectId || config.path || ''
}

export class WeblateProvider implements RemoteProvider {
  constructor(private config: RemoteConfig) {}

  async pull(): Promise<LocaleTranslations> {
    const projectId = resolveProjectId(this.config)
    if (!projectId) {
      throw new Error('Weblate provider requires projectId (or path)')
    }
    const axiosInstance = createAxiosInstance(this.config)
    const endpoint = joinURL('/projects', projectId, 'translations')
    const { data } = await axiosInstance.get<Record<string, JsonObject>>(endpoint)
    if (!isJsonObject(data)) {
      throw new Error('Invalid response from Weblate provider')
    }
    return data
  }

  async push(translations: LocaleTranslations): Promise<void> {
    const projectId = resolveProjectId(this.config)
    if (!projectId) {
      throw new Error('Weblate provider requires projectId (or path)')
    }
    const axiosInstance = createAxiosInstance(this.config)
    const endpoint = joinURL('/projects', projectId, 'translations')
    await axiosInstance.put(endpoint, translations)
  }
}
