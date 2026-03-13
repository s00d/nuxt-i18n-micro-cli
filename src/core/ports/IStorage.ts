import type { TranslationSetData } from '../types'

export interface IStorage {
  loadLocale(code: string): Promise<TranslationSetData>
  saveLocale(code: string, data: TranslationSetData): Promise<void>
}
