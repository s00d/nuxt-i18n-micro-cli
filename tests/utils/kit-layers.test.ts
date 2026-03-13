import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getI18nConfig } from '../../src/core/utils/kit'

describe('getI18nConfig layers support', () => {
  it('resolves translation directories from extended Nuxt layers', async () => {
    const cwd = path.resolve('playground')
    const config = await getI18nConfig(cwd, 'silent')
    const normalized = config.translationDirs.map(dir => dir.replaceAll(path.sep, '/'))

    expect(normalized).toContain(path.resolve('playground/locales').replaceAll(path.sep, '/'))
    expect(normalized).toContain(path.resolve('playground/layers/base/locales').replaceAll(path.sep, '/'))
    expect(normalized).toContain(path.resolve('playground/layers/marketing/locales').replaceAll(path.sep, '/'))
    expect(normalized).toContain(path.resolve('playground_base/locales').replaceAll(path.sep, '/'))
  })
})
