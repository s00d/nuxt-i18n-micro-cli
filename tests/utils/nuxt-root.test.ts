import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findNuxtRoot, hasNuxtConfig } from '../../src/core/utils/nuxt-root'

const tempDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'i18n-nuxt-root-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true })
    }
    catch {
      // ignore cleanup errors in tests
    }
  }
})

describe('nuxt-root', () => {
  it('detects nuxt.config in the starting directory', () => {
    const root = createTempDir()
    writeFileSync(path.join(root, 'nuxt.config.ts'), 'export default {}')

    expect(hasNuxtConfig(root)).toBe(true)
    expect(findNuxtRoot(root)).toBe(root)
  })

  it('walks up to parent directory with nuxt.config', () => {
    const root = createTempDir()
    writeFileSync(path.join(root, 'nuxt.config.ts'), 'export default {}')
    const nested = path.join(root, 'apps', 'web')
    mkdirSync(nested, { recursive: true })

    expect(findNuxtRoot(nested)).toBe(root)
  })

  it('returns null when no nuxt.config exists', () => {
    const root = createTempDir()
    expect(findNuxtRoot(root)).toBeNull()
  })
})
