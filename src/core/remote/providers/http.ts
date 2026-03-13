import axios from 'axios'
import { withoutTrailingSlash } from 'ufo'
import type { RemoteConfig } from '../types'

export function createAxiosInstance(config: RemoteConfig) {
  const instance = axios.create({
    baseURL: withoutTrailingSlash(config.url),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  switch (config.type) {
    case 'github':
      instance.defaults.headers.common.Accept = 'application/vnd.github.v3+json'
      instance.defaults.headers.common.Authorization = `token ${config.token}`
      break
    case 'gitlab':
      instance.defaults.headers.common['PRIVATE-TOKEN'] = config.token!
      break
    case 'custom':
      instance.defaults.auth = {
        username: config.auth!.username!,
        password: config.auth!.password!,
      }
      break
    case 'lokalise':
      instance.defaults.headers.common['X-Api-Token'] = config.token!
      break
    case 'crowdin':
      instance.defaults.headers.common.Authorization = `Bearer ${config.token}`
      break
    case 'tolgee':
      instance.defaults.headers.common['X-API-Key'] = config.token!
      break
    case 'weblate':
      instance.defaults.headers.common.Authorization = `Token ${config.token}`
      break
  }

  return instance
}
