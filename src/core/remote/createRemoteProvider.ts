import type { RemoteConfig } from './types'
import type { RemoteProvider } from './RemoteProvider'
import remoteProviderRegistry from './RemoteProviderRegistry'

export function createRemoteProvider(config: RemoteConfig): RemoteProvider {
  const ProviderClass = remoteProviderRegistry[config.type]
  if (!ProviderClass) {
    throw new Error(`Unsupported remote type: ${(config as { type?: string }).type || 'unknown'}`)
  }
  return new ProviderClass(config)
}
