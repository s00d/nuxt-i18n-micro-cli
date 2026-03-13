import { describe, expect, it } from 'vitest'
import { TranslationSet } from '../../src/core/TranslationSet'
import { generatePseudoLocale, pseudoLocalizeText } from '../../src/core/services/PseudoService'

function createProjectFixture() {
  const en = new TranslationSet({
    global: {
      home: {
        title: 'Hello {name}',
        subtitle: 'Save @:common.save',
      },
      common: {
        save: 'Save',
      },
    },
    pages: {
      dashboard: {
        title: 'Dashboard',
      },
    },
  })
  const enXa = new TranslationSet({
    global: {
      home: {
        title: '[Existing]',
      },
    },
    pages: {},
  })
  const map: Record<string, TranslationSet> = { en, 'en-xa': enXa }

  return {
    config: {
      defaultLocale: 'en',
      locales: [{ code: 'en' }, { code: 'en-xa' }],
    },
    getLocale: (code: string) => map[code],
  }
}

describe('pseudoLocalizeText', () => {
  it('keeps i18n placeholders and references', () => {
    const result = pseudoLocalizeText('Hello {name} @:common.save')
    expect(result).toContain('{name}')
    expect(result).toContain('@:common.save')
    expect(result).toContain('[')
    expect(result).toContain(']')
  })
})

describe('generatePseudoLocale', () => {
  it('fills target locale from source locale and pseudo-localizes values', () => {
    const project = createProjectFixture()

    const result = generatePseudoLocale(project as never, {
      sourceLocale: 'en',
      targetLocale: 'en-xa',
      replace: true,
    })

    expect(result.updatedKeys).toBe(4)
    expect(result.skippedKeys).toBe(0)
    expect(project.getLocale('en-xa').getValue('home.title', 'global')).toContain('{name}')
    expect(project.getLocale('en-xa').getValue('home.subtitle', 'global')).toContain('@:common.save')
    expect(project.getLocale('en-xa').getValue('title', 'dashboard')).toBeTypeOf('string')
  })

  it('skips existing target values when replace is false', () => {
    const project = createProjectFixture()

    const result = generatePseudoLocale(project as never, {
      sourceLocale: 'en',
      targetLocale: 'en-xa',
      replace: false,
    })

    expect(result.updatedKeys).toBe(3)
    expect(result.skippedKeys).toBe(1)
  })
})
