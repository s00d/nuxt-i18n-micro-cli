import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { searchProjectTranslations } from '../../src/core/services/SearchService'

const tempDirs: string[] = []

function createTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8')
}

function writeText(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

describe('SearchService', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('finds keys by value, computes coverage, usages, and hardcoded text', async () => {
    const projectRoot = createTempDir('i18n-search-project-')
    const baseLayer = path.join(projectRoot, 'layer-base', 'locales')
    const rootLayer = path.join(projectRoot, 'locales')

    writeJson(path.join(baseLayer, 'en.json'), {
      common: { greet: 'Hello from base' },
    })
    writeJson(path.join(rootLayer, 'en.json'), {
      common: { greet: 'Hello from root' },
    })
    writeJson(path.join(rootLayer, 'ru.json'), {
      common: { greet: 'Привет мир' },
    })

    writeText(path.join(projectRoot, 'pages', 'index.vue'), `
<template>
  <div>
    {{ $t('common.greet') }}
    Привет мир без локализации
  </div>
</template>
`)

    const result = await searchProjectTranslations({
      cwd: projectRoot,
      query: 'Привет мир',
      locales: [{ code: 'en' }, { code: 'ru' }, { code: 'de' }],
      translationDirs: [baseLayer, rootLayer],
    })

    expect(result.totalMatches).toBe(1)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]?.fullKey).toBe('common.greet')
    expect(result.matches[0]?.translations.en).toBe('Hello from root')
    expect(result.matches[0]?.translations.ru).toBe('Привет мир')
    expect(result.matches[0]?.translations.de).toBeNull()
    expect(result.matches[0]?.missingLocales).toContain('de')
    expect(result.matches[0]?.usages.length).toBeGreaterThan(0)
    expect(result.hardcoded.length).toBeGreaterThan(0)
    expect(result.matches[0]?.translationLocations[0]?.file.startsWith('/')).toBe(true)
  })

  it('supports scope, onlyUnused and limit filters', async () => {
    const projectRoot = createTempDir('i18n-search-filter-')
    const rootLayer = path.join(projectRoot, 'locales')

    writeJson(path.join(rootLayer, 'en.json'), {
      common: { used: 'Used value', unused: 'Unused value' },
    })
    writeJson(path.join(rootLayer, 'ru.json'), {
      common: { used: 'Используется', unused: 'Не используется' },
    })
    writeJson(path.join(rootLayer, 'pages', 'catalog', 'en.json'), {
      catalog: { title: 'Catalog page title' },
    })
    writeJson(path.join(rootLayer, 'pages', 'catalog', 'ru.json'), {
      catalog: { title: 'Заголовок каталога' },
    })
    writeText(path.join(projectRoot, 'pages', 'index.vue'), `{{ $t('common.used') }}`)

    const result = await searchProjectTranslations({
      cwd: projectRoot,
      query: 'value',
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDirs: [rootLayer],
      scope: 'global',
      onlyUnused: true,
      limit: 1,
    })

    expect(result.totalMatches).toBe(1)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]?.key).toBe('common.unused')
    expect(result.matches[0]?.isUsed).toBe(false)
  })

  it('returns top-N by relevance with usage priority', async () => {
    const projectRoot = createTempDir('i18n-search-ranking-')
    const rootLayer = path.join(projectRoot, 'locales')

    writeJson(path.join(rootLayer, 'en.json'), {
      common: {
        exact: 'Alpha text',
        partial: 'Alpha heading',
      },
    })
    writeJson(path.join(rootLayer, 'ru.json'), {
      common: {
        exact: 'Альфа текст',
        partial: 'Альфа заголовок',
      },
    })
    writeText(path.join(projectRoot, 'pages', 'index.vue'), `
<template>
  <div>{{ $t('common.exact') }}</div>
</template>
`)

    const result = await searchProjectTranslations({
      cwd: projectRoot,
      query: 'common',
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDirs: [rootLayer],
      limit: 1,
    })

    expect(result.totalMatches).toBe(2)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]?.key).toBe('common.exact')
    expect(result.matches[0]?.isUsed).toBe(true)
  })

  it('prefers unused keys when preferUnused is enabled', async () => {
    const projectRoot = createTempDir('i18n-search-prefer-unused-')
    const rootLayer = path.join(projectRoot, 'locales')

    writeJson(path.join(rootLayer, 'en.json'), {
      common: {
        exact: 'Alpha text',
        partial: 'Alpha heading',
      },
    })
    writeJson(path.join(rootLayer, 'ru.json'), {
      common: {
        exact: 'Альфа текст',
        partial: 'Альфа заголовок',
      },
    })
    writeText(path.join(projectRoot, 'pages', 'index.vue'), `
<template>
  <div>{{ $t('common.exact') }}</div>
</template>
`)

    const result = await searchProjectTranslations({
      cwd: projectRoot,
      query: 'common',
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDirs: [rootLayer],
      preferUnused: true,
      limit: 1,
    })

    expect(result.totalMatches).toBe(2)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]?.key).toBe('common.partial')
    expect(result.matches[0]?.isUsed).toBe(false)
  })

  it('detects hardcoded text even when line also contains $t call', async () => {
    const projectRoot = createTempDir('i18n-search-hardcoded-mixed-line-')
    const rootLayer = path.join(projectRoot, 'locales')

    writeJson(path.join(rootLayer, 'en.json'), {
      layerMeta: { active: 'root' },
    })
    writeJson(path.join(rootLayer, 'ru.json'), {
      layerMeta: { active: 'root' },
    })
    writeText(path.join(projectRoot, 'pages', 'catalog.vue'), `
<template>
  <p><strong>Layer active:</strong> {{ $t('layerMeta.active') }}</p>
</template>
`)

    const result = await searchProjectTranslations({
      cwd: projectRoot,
      query: 'Layer active',
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDirs: [rootLayer],
    })

    expect(result.matches).toHaveLength(0)
    expect(result.hardcoded).toHaveLength(1)
    expect(result.hardcoded[0]?.content).toContain('Layer active')
  })

  it('scans for hardcoded text not present in translations without query', async () => {
    const projectRoot = createTempDir('i18n-search-hardcoded-only-')
    const rootLayer = path.join(projectRoot, 'locales')

    writeJson(path.join(rootLayer, 'en.json'), {
      common: { title: 'Known translated title' },
    })
    writeJson(path.join(rootLayer, 'ru.json'), {
      common: { title: 'Известный переведенный заголовок' },
    })

    writeText(path.join(projectRoot, 'pages', 'known.vue'), `
<template>
  <h1>Known translated title</h1>
</template>
`)
    writeText(path.join(projectRoot, 'pages', 'raw.vue'), `
<template>
  <h2>Raw hardcoded heading</h2>
</template>
`)
    writeText(path.join(projectRoot, 'plugins', 'x.ts'), `const x = "Raw hardcoded heading in ts";`)

    const result = await searchProjectTranslations({
      cwd: projectRoot,
      query: '',
      locales: [{ code: 'en' }, { code: 'ru' }],
      translationDirs: [rootLayer],
      hardcodedOnly: true,
      onlyVue: true,
    })

    expect(result.matches).toHaveLength(0)
    expect(result.hardcoded.some(item => item.file.endsWith('/pages/raw.vue'))).toBe(true)
    expect(result.hardcoded.some(item => item.file.endsWith('/pages/known.vue'))).toBe(false)
    expect(result.hardcoded.some(item => item.file.endsWith('/plugins/x.ts'))).toBe(false)
  })
})
