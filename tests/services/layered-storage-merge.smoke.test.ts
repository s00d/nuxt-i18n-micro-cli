import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { FileSystemStorage } from '../../src/core/adapters/FileSystemStorage'

const tempDirs: string[] = []

function createLayer(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8')
}

describe('FileSystemStorage layered merge', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('merges global and page dictionaries in layer order base -> top', async () => {
    const base = createLayer('i18n-layer-base-')
    const marketing = createLayer('i18n-layer-marketing-')
    const root = createLayer('i18n-layer-root-')

    writeJson(path.join(base, 'en.json'), {
      landing: {
        title: 'base-title',
        subtitle: 'base-subtitle',
      },
      shared: {
        value: 'base',
      },
    })
    writeJson(path.join(base, 'pages', 'catalog', 'en.json'), {
      catalog: {
        hero: 'base-hero',
        details: {
          shipping: 'base-shipping',
          returns: 'base-returns',
        },
      },
    })

    writeJson(path.join(marketing, 'en.json'), {
      landing: {
        title: 'marketing-title',
      },
      shared: {
        marketing: 'on',
      },
    })
    writeJson(path.join(marketing, 'pages', 'catalog', 'en.json'), {
      catalog: {
        hero: 'marketing-hero',
        description: 'marketing-description',
      },
    })

    writeJson(path.join(root, 'en.json'), {
      landing: {
        subtitle: 'root-subtitle',
      },
      shared: {
        value: 'root',
      },
    })
    writeJson(path.join(root, 'pages', 'catalog', 'en.json'), {
      catalog: {
        details: {
          returns: 'root-returns',
        },
      },
    })

    const storage = new FileSystemStorage(root, [base, marketing, root])
    const data = await storage.loadLocale('en')

    expect(data.global).toEqual({
      landing: {
        title: 'marketing-title',
        subtitle: 'root-subtitle',
      },
      shared: {
        value: 'root',
        marketing: 'on',
      },
    })
    expect(data.pages.catalog).toEqual({
      catalog: {
        hero: 'marketing-hero',
        description: 'marketing-description',
        details: {
          shipping: 'base-shipping',
          returns: 'root-returns',
        },
      },
    })
  })
})
