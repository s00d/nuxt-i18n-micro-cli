import { existsSync } from 'node:fs'
import path from 'node:path'

const NUXT_CONFIG_FILES = [
  'nuxt.config.ts',
  'nuxt.config.js',
  'nuxt.config.mjs',
  'nuxt.config.cjs',
] as const

export function hasNuxtConfig(dir: string): boolean {
  return NUXT_CONFIG_FILES.some(file => existsSync(path.join(dir, file)))
}

/**
 * Walk up from `startDir` until a directory containing `nuxt.config.*` is found.
 */
export function findNuxtRoot(startDir: string): string | null {
  let current = path.resolve(startDir)

  while (true) {
    if (hasNuxtConfig(current)) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}
