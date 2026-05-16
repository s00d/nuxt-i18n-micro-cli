import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

const runtimeDeps = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
])

const builtinSet = new Set([
  ...builtinModules,
  ...builtinModules.map(mod => `node:${mod}`),
])

function normalizeImportId(id: string): string {
  return id.split('?')[0].split('#')[0]
}

function getPackageName(id: string): string | null {
  if (id.startsWith('@')) {
    const [scope, name] = id.split('/')
    return scope && name ? `${scope}/${name}` : null
  }
  const [name] = id.split('/')
  return name || null
}

function isBareImport(id: string): boolean {
  return !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0')
}

// Keep this explicit list for high-cost SDKs used by translators.
// Even if they are present in dependencies, this documents intent.
const translatorSdkExternals = new Set([
  '@azure-rest/ai-translation-text',
  '@crowdin/crowdin-api-client',
  '@gitbeaker/rest',
  '@lokalise/node-api',
  '@vitalets/google-translate-api',
  '@yandex-cloud/nodejs-sdk',
  'ai',
  'deepl-node',
  'modernmt',
  'octokit',
  'zod',
])

// Keep empty by default: runtime deps stay external unless explicitly bundled.
const forceBundlePackages = new Set<string>([])

// Escape hatch: always externalize specific packages.
const forceExternalPackages = new Set<string>([
  ...translatorSdkExternals,
  '@nuxt/kit',
  '@nuxt/schema',
  'nuxt',
])

function isExternal(id: string): boolean {
  const normalizedId = normalizeImportId(id)

  if (normalizedId.startsWith('node:') || builtinSet.has(normalizedId)) {
    return true
  }

  if (!isBareImport(normalizedId)) {
    return false
  }

  const packageName = getPackageName(normalizedId)
  if (!packageName) {
    return false
  }

  if (forceBundlePackages.has(packageName)) {
    return false
  }

  if (forceExternalPackages.has(packageName)) {
    return true
  }

  if (packageName.startsWith('@ai-sdk/')) {
    return true
  }

  return runtimeDeps.has(packageName)
}

export default defineConfig({
  build: {
    target: 'node16',
    minify: 'esbuild',
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: isExternal,
      treeshake: true,
      onwarn(warning, warn) {
        if (
          warning.message.includes('chokidar/index.js')
          && warning.message.includes('never used')
        ) {
          return
        }
        warn(warning)
      },
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
