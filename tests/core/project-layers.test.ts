import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { I18nProject } from '../../src/core/Project'

describe('I18nProject layered loading', () => {
  it('keeps layered sources when translationDir matches config default', async () => {
    const cwd = path.resolve('playground')
    const project = await I18nProject.load(cwd, { translationDir: 'locales', logLevel: 'silent' })
    const global = project.getDefaultLocaleSet().getFlatGlobalKeys()

    expect(global['baseRoot.title']).toBe('Playground Base Layer')
    expect(global['layerMeta.fromPlaygroundBase']).toBe('yes')
    expect(global['layerMeta.base']).toBe('base-layer')
    expect(global['layerMeta.active']).toBe('root')
  })
})
