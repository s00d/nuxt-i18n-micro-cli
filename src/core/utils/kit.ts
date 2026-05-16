import path from 'node:path'
import { I18nConfigError } from '../errors'
import { importModule, tryResolveModule } from '../esm'
import { findNuxtRoot } from './nuxt-root'

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
    if (typeof kit.writeTypes !== 'function') {
      try {
        const { writeTypes } = await import('@nuxt/kit')
        if (typeof writeTypes === 'function') {
          kit = { ...kit, writeTypes }
        }
      }
      catch {
        // @nuxt/kit is provided by the host Nuxt project when available
      }
    }
    return kit
  }
  catch (e: unknown) {
    if (e!.toString().includes('Cannot find module \'@nuxt/kit\'')) {
      throw new I18nConfigError({
        code: 'NUXT_LOAD_FAILED',
        cwd: rootDir,
        nuxtRoot: rootDir,
        message: 'Cannot load Nuxt Kit in this project.',
        hints: [
          'Install Nuxt in the project: npm install nuxt (or pnpm add nuxt).',
          'Run the command from your Nuxt app root (directory with nuxt.config.*).',
        ],
        cause: e,
      })
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

function collectModuleIds(modules: unknown): string[] {
  if (!Array.isArray(modules)) {
    return []
  }

  const ids: string[] = []
  for (const entry of modules) {
    if (typeof entry === 'string') {
      ids.push(entry)
      continue
    }
    if (Array.isArray(entry) && typeof entry[0] === 'string') {
      ids.push(entry[0])
    }
  }
  return ids
}

function hasI18nMicroModule(modules: unknown): boolean {
  return collectModuleIds(modules).some(id => id.includes('nuxt-i18n-micro'))
}

function buildNotNuxtProjectError(requestedCwd: string): I18nConfigError {
  return new I18nConfigError({
    code: 'NOT_NUXT_PROJECT',
    cwd: requestedCwd,
    message: 'No Nuxt project found for i18n-micro.',
    hints: [
      'Run this command inside a Nuxt app directory (where nuxt.config.ts exists).',
      'Or pass an explicit project path: i18n-micro <command> --cwd /path/to/nuxt-app',
      'To bootstrap a new project: i18n-micro init',
    ],
  })
}

function buildI18nMissingError(nuxtRoot: string, requestedCwd: string, modules: unknown): I18nConfigError {
  const hints = [
    'Add nuxt-i18n-micro to nuxt.config modules and configure the i18n block.',
    'Example: modules: [\'nuxt-i18n-micro\'], i18n: { locales: [\'en\'], defaultLocale: \'en\' }',
    'Docs: https://github.com/s00d/nuxt-i18n-micro',
  ]

  if (!hasI18nMicroModule(modules)) {
    return new I18nConfigError({
      code: 'I18N_MODULE_MISSING',
      cwd: requestedCwd,
      nuxtRoot,
      message: 'Nuxt project found, but nuxt-i18n-micro is not installed or not enabled.',
      hints: [
        'Install: npm install nuxt-i18n-micro (or pnpm add nuxt-i18n-micro)',
        'Enable in nuxt.config: modules: [\'nuxt-i18n-micro\']',
        ...hints,
      ],
    })
  }

  return new I18nConfigError({
    code: 'I18N_NOT_CONFIGURED',
    cwd: requestedCwd,
    nuxtRoot,
    message: 'nuxt-i18n-micro is enabled, but no i18n configuration was resolved.',
    hints,
  })
}

export async function getI18nConfig(cwd: string, logLevel?: string): Promise<{ locales: Array<{ code: string }>, translationDir: string, translationDirs: string[], defaultLocale: string, nuxtRoot: string }> {
  const requestedCwd = path.resolve(cwd)
  const nuxtRoot = findNuxtRoot(requestedCwd)

  if (!nuxtRoot) {
    throw buildNotNuxtProjectError(requestedCwd)
  }

  const kit = await loadKit(nuxtRoot)
  const baseOverrides = {
    logLevel: logLevel as 'silent' | 'info' | 'verbose' | undefined ?? 'silent',
    vite: {
      clearScreen: false,
    },
  }

  let nuxt: Awaited<ReturnType<typeof kit.loadNuxt>>
  try {
    nuxt = await kit.loadNuxt({
      cwd: nuxtRoot,
      dotenv: { cwd: nuxtRoot },
      overrides: baseOverrides,
    })
  }
  catch (error) {
    const message = String(error)
    // In CI/tests the playground module package might not be installed in the root workspace.
    // For i18n config discovery we only need resolved Nuxt options/layers, so retry without modules.
    if (!message.includes('Could not load `nuxt-i18n-micro`')) {
      throw new I18nConfigError({
        code: 'NUXT_LOAD_FAILED',
        cwd: requestedCwd,
        nuxtRoot,
        message: 'Failed to load Nuxt configuration.',
        hints: [
          'Verify that nuxt.config.* is valid and dependencies are installed.',
          'Run with --debug to see the full stack trace.',
        ],
        cause: error,
      })
    }

    try {
      nuxt = await kit.loadNuxt({
        cwd: nuxtRoot,
        dotenv: { cwd: nuxtRoot },
        overrides: {
          ...baseOverrides,
          modules: [],
        },
      })
    }
    catch (retryError) {
      throw new I18nConfigError({
        code: 'NUXT_LOAD_FAILED',
        cwd: requestedCwd,
        nuxtRoot,
        message: 'Failed to load Nuxt configuration.',
        hints: [
          'Verify that nuxt.config.* is valid and dependencies are installed.',
          'Run with --debug to see the full stack trace.',
        ],
        cause: retryError,
      })
    }
  }

  const nuxtOptions = nuxt.options as {
    i18n?: { locales?: Array<{ code: string }>, translationDir?: string, defaultLocale?: string }
    modules?: unknown
  }
  const i18n = nuxtOptions.i18n

  if (!i18n) {
    throw buildI18nMissingError(nuxtRoot, requestedCwd, nuxtOptions.modules)
  }

  const locales = i18n.locales ?? []
  const translationDirName = i18n.translationDir ?? 'locales'
  const translationDir = path.resolve(nuxtRoot, translationDirName)

  const layerRootDirs = (
    (nuxt.options as unknown as { _layers?: ReadonlyArray<{ config?: { rootDir?: string } }> })._layers ?? []
  )
    .map(layer => layer.config?.rootDir)
    .filter((rootDir): rootDir is string => Boolean(rootDir))
    .reverse()
  const translationDirs = Array.from(new Set(
    (layerRootDirs.length > 0 ? layerRootDirs : [nuxtRoot])
      .map(rootDir => path.resolve(rootDir, translationDirName)),
  ))

  if (!locales.length) {
    throw new I18nConfigError({
      code: 'NO_LOCALES',
      cwd: requestedCwd,
      nuxtRoot,
      message: 'i18n configuration has no locales.',
      hints: [
        'Add at least one locale in nuxt.config, e.g. i18n: { locales: [\'en\'], defaultLocale: \'en\' }',
      ],
    })
  }

  if (!translationDir) {
    throw new I18nConfigError({
      code: 'NO_TRANSLATION_DIR',
      cwd: requestedCwd,
      nuxtRoot,
      message: 'Translation directory is not defined in i18n configuration.',
      hints: [
        'Set i18n.translationDir in nuxt.config (default is "locales").',
      ],
    })
  }

  const defaultLocale = i18n.defaultLocale ?? 'en'

  return { locales, translationDir, translationDirs, defaultLocale, nuxtRoot }
}
