import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { TranslationSet } from '../../src/core/TranslationSet'
import { renameProjectKey } from '../../src/core/services/RenameService'

function createProjectFixture(tempRoot: string) {
  const en = new TranslationSet({
    global: {
      home: {
        title: 'Welcome',
        subtitle: 'Subtitle with @:home.title',
      },
    },
    pages: {},
  })
  const ru = new TranslationSet({
    global: {
      home: {
        title: 'Privet',
        subtitle: 'Podzagolovok @:home.title',
      },
    },
    pages: {},
  })
  const map: Record<string, TranslationSet> = { en, ru }

  return {
    config: {
      cwd: tempRoot,
      locales: [{ code: 'en' }, { code: 'ru' }],
    },
    getLocaleCodes: () => ['en', 'ru'],
    getLocale: (code: string) => map[code],
  }
}

describe('renameProjectKey', () => {
  it('renames translation key and updates source calls', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-rename-'))
    const sourceFile = path.join(tempRoot, 'components', 'welcome.ts')
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true })
    fs.writeFileSync(sourceFile, 'const a = $t(\'home.title\')\nconst b = i18n.t("home.title")\n', 'utf8')

    const project = createProjectFixture(tempRoot)
    const result = renameProjectKey(project as never, {
      from: 'home.title',
      to: 'home.hero.title',
      dryRun: false,
    })

    expect(result.localesUpdated).toBe(2)
    expect(result.localeReferencesUpdated).toBe(2)
    expect(result.sourceFilesUpdated).toBe(1)
    expect(project.getLocale('en').getValue('home.title', 'global')).toBeUndefined()
    expect(project.getLocale('en').getValue('home.hero.title', 'global')).toBe('Welcome')
    expect(project.getLocale('en').getValue('home.subtitle', 'global')).toBe('Subtitle with @:home.hero.title')
    expect(fs.readFileSync(sourceFile, 'utf8')).toContain('$t(\'home.hero.title\')')
  })

  it('throws when target key already exists', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-rename-conflict-'))
    const en = new TranslationSet({
      global: {
        home: {
          title: 'Welcome',
          hero: { title: 'Already exists' },
        },
      },
      pages: {},
    })
    const project = {
      config: { cwd: tempRoot, locales: [{ code: 'en' }] },
      getLocaleCodes: () => ['en'],
      getLocale: () => en,
    }

    expect(() => renameProjectKey(project as never, {
      from: 'home.title',
      to: 'home.hero.title',
      dryRun: false,
    })).toThrow('Target key already exists')
  })
})
