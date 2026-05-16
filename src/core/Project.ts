import { resolve } from 'pathe'
import { cliNotFoundError } from './errors'
import { FileSystemStorage } from './adapters/FileSystemStorage'
import { getI18nConfig } from './utils/kit'
import { TranslationSet } from './TranslationSet'
import type { IStorage } from './ports/IStorage'
import type { ProjectConfig, ProjectLoadOptions } from './types'

export class I18nProject {
  public readonly config: ProjectConfig

  private readonly storage: IStorage
  private readonly translations: Record<string, TranslationSet>

  private constructor(config: ProjectConfig, storage: IStorage, translations: Record<string, TranslationSet>) {
    this.config = config
    this.storage = storage
    this.translations = translations
  }

  static async load(cwd: string, options: ProjectLoadOptions = {}): Promise<I18nProject> {
    const resolvedCwd = resolve(cwd)
    const i18nConfig = await getI18nConfig(resolvedCwd, options.logLevel)
    const projectRoot = i18nConfig.nuxtRoot
    const requestedTranslationDir = options.translationDir ? resolve(projectRoot, options.translationDir) : undefined
    const translationDir = requestedTranslationDir || i18nConfig.translationDir
    const useLayeredSources = !requestedTranslationDir || requestedTranslationDir === i18nConfig.translationDir
    const translationDirs = useLayeredSources ? i18nConfig.translationDirs : [translationDir]
    const storage = new FileSystemStorage(translationDir, translationDirs)
    const translations: Record<string, TranslationSet> = {}

    for (const locale of i18nConfig.locales) {
      const localeData = await storage.loadLocale(locale.code)
      translations[locale.code] = TranslationSet.fromData(localeData)
    }

    return new I18nProject(
      {
        cwd: projectRoot,
        defaultLocale: i18nConfig.defaultLocale,
        locales: i18nConfig.locales,
        translationDir,
        translationDirs,
      },
      storage,
      translations,
    )
  }

  getLocale(code: string): TranslationSet {
    const locale = this.translations[code]
    if (!locale) {
      throw cliNotFoundError(`Locale ${code} not found`, [
        'Check configured locales in nuxt.config i18n.locales.',
      ], { Locale: code })
    }
    return locale
  }

  getDefaultLocaleSet(): TranslationSet {
    return this.getLocale(this.config.defaultLocale)
  }

  getLocaleCodes(): string[] {
    return this.config.locales.map(locale => locale.code)
  }

  cleanUnused(usedGlobalKeys: Set<string>, usedPageKeys: Record<string, Set<string>>, shouldKeepKey?: (fullPath: string) => boolean): void {
    for (const code of this.getLocaleCodes()) {
      const localeSet = this.getLocale(code)
      localeSet.retainOnlyGlobal(usedGlobalKeys, shouldKeepKey)

      const allPageScopes = new Set([...localeSet.getPageScopes(), ...Object.keys(usedPageKeys)])
      for (const pageScope of allPageScopes) {
        localeSet.retainOnlyPage(pageScope, usedPageKeys[pageScope] ?? new Set<string>(), shouldKeepKey)
      }
    }
  }

  async save(): Promise<void> {
    for (const code of this.getLocaleCodes()) {
      const localeSet = this.getLocale(code)
      if (!localeSet.isModified) {
        continue
      }
      await this.storage.saveLocale(code, localeSet.toData())
    }
  }
}
