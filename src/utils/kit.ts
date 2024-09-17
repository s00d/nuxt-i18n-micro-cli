// we are deliberately inlining this code as a backup in case user has `@nuxt/schema<3.7`
import path from 'node:path'
import { writeTypes as writeTypesLegacy } from '@nuxt/kit'
import { importModule, tryResolveModule } from './esm'

export const loadKit = async (
  rootDir: string,
): Promise<typeof import('@nuxt/kit')> => {
  try {
    // Without PNP (or if users have a local install of kit, we bypass resolving from Nuxt)
    const localKit = await tryResolveModule('@nuxt/kit', rootDir)
    // Otherwise, we resolve Nuxt _first_ as it is Nuxt's kit dependency that will be used
    const rootURL = localKit ? rootDir : (await tryResolveNuxt()) || rootDir
    let kit: typeof import('@nuxt/kit') = await importModule(
      '@nuxt/kit',
      rootURL,
    )
    if (!kit.writeTypes) {
      // Polyfills for schema < 3.7
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
    const path = await tryResolveModule(pkg)
    if (path) {
      return path
    }
  }
  return null
}

export async function getI18nConfig(cwd: string): Promise<{ locales: Array<{ code: string }>, translationDir: string, defaultLocale: string }> {
  const kit = await loadKit(cwd)
  const nuxt = await kit.loadNuxt({
    cwd,
    dotenv: { cwd },
  })

  const i18n = (nuxt.options as any).i18n

  if (!i18n) {
    throw new Error('No i18n configuration.')
  }

  const locales = i18n.locales ?? []
  const translationDir = path.resolve(
    cwd,
    i18n.translationDir ?? 'locales',
  )

  if (!locales.length) {
    throw new Error('No locales found in i18n configuration.')
  }

  if (!translationDir) {
    throw new Error('Translation directory not defined in i18n configuration.')
  }

  const defaultLocale = i18n.defaultLocale ?? 'en'

  return { locales, translationDir, defaultLocale }
}
