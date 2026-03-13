import type { LocaleTranslations } from './types'

export interface RemoteProvider {
  pull(): Promise<LocaleTranslations>
  push(translations: LocaleTranslations): Promise<void>
}

export type RemoteProviderConstructor = new (...args: any[]) => RemoteProvider
