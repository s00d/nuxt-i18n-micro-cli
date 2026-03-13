import path from 'node:path'
import { writeTypes as writeTypesLegacy } from '@nuxt/kit'
import { importModule, tryResolveModule } from '../esm'

export const loadKit = async (
  rootDir: string,
): Promise<typeof import('@nuxt/kit')> => {
  try {
    const localKit = await tryResolveModule('@nuxt/kit', rootDir)
    const rootURL = localKit ? rootDir : (await tryResolveNuxt()) || rootDir
    let kit: typeof import('@nuxt/kit') = await importModule(
      '@nuxt/kit',
      rootURL,
    )
    if (!kit.writeTypes) {
      kit = { ...kit, writeTypes: writeTypesLegacy }
    }
    return kit
  }
  catch (e: unknown) {
    if (e!.toString().includes('Cannot find module \'@nuxt/kit\'')) {
      throw new Error(
        'nuxi requires `@nuxt/kit` to be installed in your project. Try installing `nuxt` v3 or `@nuxt/bridge` first.',
      )
    }
    throw e
  }
}

async function tryResolveNuxt() {
  for (const pkg of ['nuxt-nightly', 'nuxt3', 'nuxt', 'nuxt-edge']) {
    const resolved = await tryResolveModule(pkg)
    if (resolved) {
      return resolved
    }
  }
  return null
}

export async function getI18nConfig(cwd: string, logLevel?: string): Promise<{ locales: Array<{ code: string }>, translationDir: string, translationDirs: string[], defaultLocale: string }> {
  const kit = await loadKit(cwd)
  const nuxt = await kit.loadNuxt({
    cwd,
    dotenv: { cwd },
    overrides: {
      logLevel: logLevel as 'silent' | 'info' | 'verbose' | undefined ?? 'silent',
      vite: {
        clearScreen: false,
      },
    },
  })

  const nuxtOptions = nuxt.options as { i18n?: { locales?: Array<{ code: string }>, translationDir?: string, defaultLocale?: string } }
  const i18n = nuxtOptions.i18n

  if (!i18n) {
    throw new Error('No i18n configuration.')
  }

  const locales = i18n.locales ?? []
  const translationDirName = i18n.translationDir ?? 'locales'
  const translationDir = path.resolve(cwd, translationDirName)

  const layerRootDirs = (
    (nuxt.options as unknown as { _layers?: ReadonlyArray<{ config?: { rootDir?: string } }> })._layers ?? []
  )
    .map(layer => layer.config?.rootDir)
    .filter((rootDir): rootDir is string => Boolean(rootDir))
    .reverse()
  const translationDirs = Array.from(new Set(
    (layerRootDirs.length > 0 ? layerRootDirs : [cwd])
      .map(rootDir => path.resolve(rootDir, translationDirName)),
  ))

  if (!locales.length) {
    throw new Error('No locales found in i18n configuration.')
  }

  if (!translationDir) {
    throw new Error('Translation directory not defined in i18n configuration.')
  }

  const defaultLocale = i18n.defaultLocale ?? 'en'

  return { locales, translationDir, translationDirs, defaultLocale }
}
