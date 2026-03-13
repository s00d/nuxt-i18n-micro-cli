import { joinURL } from 'ufo'
import { isJsonObject, type JsonObject } from '../../types'
import type { LocaleTranslations, RemoteConfig } from '../types'
import { createAxiosInstance } from './http'
import type { RemoteProvider } from '../RemoteProvider'

export class CustomProvider implements RemoteProvider {
  constructor(private config: RemoteConfig) {}

  async pull(): Promise<LocaleTranslations> {
    const apiPath = this.config.path || 'translations'
    const axiosInstance = createAxiosInstance(this.config)
    const { data } = await axiosInstance.get<Record<string, JsonObject>>(joinURL('/', apiPath))
    if (!isJsonObject(data)) {
      throw new Error('Invalid response from custom remote')
    }
    return data
  }

  async push(translations: LocaleTranslations): Promise<void> {
    const apiPath = this.config.path || 'translations'
    const axiosInstance = createAxiosInstance(this.config)
    await axiosInstance.put(joinURL('/', apiPath), translations)
  }
}
