import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  addGlossaryEntry,
  getGlossaryEntriesForPair,
  loadGlossaryCatalog,
  removeGlossaryEntry,
  saveGlossaryCatalog,
} from '../../src/core/services/GlossaryService'

describe('GlossaryService', () => {
  it('loads, saves and filters entries by language pair', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-glossary-'))
    const glossaryFile = path.join(tempRoot, '.i18n-glossary.json')

    const catalog = loadGlossaryCatalog(glossaryFile)
    expect(catalog.entries).toEqual([])

    addGlossaryEntry(catalog, {
      source: 'Save',
      target: 'Сохранить',
      from: 'en',
      to: 'ru',
    })
    addGlossaryEntry(catalog, {
      source: 'Dashboard',
      target: 'Панель',
    })
    saveGlossaryCatalog(glossaryFile, catalog)

    const saved = loadGlossaryCatalog(glossaryFile)
    expect(saved.entries).toHaveLength(2)
    expect(getGlossaryEntriesForPair(saved, 'en', 'ru')).toHaveLength(2)
    expect(getGlossaryEntriesForPair(saved, 'en', 'de')).toHaveLength(1)
  })

  it('removes matching entry', () => {
    const catalog = {
      entries: [
        { source: 'Save', target: 'Сохранить', from: 'en', to: 'ru' },
        { source: 'Dashboard', target: 'Панель' },
      ],
    }

    const removed = removeGlossaryEntry(catalog, {
      source: 'Save',
      from: 'en',
      to: 'ru',
    })

    expect(removed).toBe(1)
    expect(catalog.entries).toHaveLength(1)
  })
})
