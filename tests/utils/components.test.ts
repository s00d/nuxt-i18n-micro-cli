import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { extractDynamicKeyWarnings, extractKeys } from '../../src/core/utils/components'

describe('components.extractKeys', () => {
  test('extracts keys from fixture Vue file and ignores commented keys', () => {
    const fixturePath = path.resolve('tests/fixtures/extract/sample.vue')
    const content = fs.readFileSync(fixturePath, 'utf8')
    const keys = extractKeys(content)

    expect(keys.has('visible.key')).toBe(true)
    expect(keys.has('commented.key')).toBe(false)
    expect(keys.has('multiline.key')).toBe(true)
    expect(keys.has('items.count')).toBe(true)
  })

  test('extracts keys from large fixture with multiline and mixed calls', () => {
    const fixturePath = path.resolve('tests/fixtures/extract/large-sample.vue')
    const content = fs.readFileSync(fixturePath, 'utf8')
    const keys = extractKeys(content)

    expect(keys.has('hidden.in.comment')).toBe(false)
    expect(keys.has('dashboard.title')).toBe(true)
    expect(keys.has('dashboard.subtitle')).toBe(true)
    expect(keys.has('button.tooltip')).toBe(true)
    expect(keys.has('button.label')).toBe(true)
    expect(keys.has('items.count')).toBe(true)
    expect(keys.has('items.single')).toBe(true)
    expect(keys.has('footer.text')).toBe(true)
    expect(keys.has('footer.multiline')).toBe(true)
    expect(keys.has('footer.plural')).toBe(true)
  })

  test('matches snapshot for extracted keys from mega dashboard fixture', () => {
    const fixturePath = path.resolve('tests/fixtures/extract/mega-dashboard.vue')
    const content = fs.readFileSync(fixturePath, 'utf8')
    const keys = extractKeys(content)
    const sorted = [...keys].sort()

    expect(sorted).toMatchSnapshot()
  })

  test('collects warnings for dynamic translation key expressions', () => {
    const content = `
      const code = 'forbidden'
      const value = $t('errors.' + code)
      const second = $tc(\`items.\${code}\`, count)
    `
    const warnings = extractDynamicKeyWarnings(content)
    expect(warnings.length).toBe(2)
  })
})
