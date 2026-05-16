import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { collectProjectSourceFiles } from '../../src/core/utils/source-files'

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

describe('collectProjectSourceFiles', () => {
  const roots: string[] = []

  afterEach(() => {
    for (const root of roots) {
      fs.rmSync(root, { recursive: true, force: true })
    }
    roots.length = 0
  })

  it('collects classic Nuxt 3 paths at project root', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-cli-src-'))
    roots.push(cwd)
    writeFile(path.join(cwd, 'pages', 'index.vue'), '<template></template>')
    writeFile(path.join(cwd, 'layouts', 'default.vue'), '<template></template>')
    writeFile(path.join(cwd, 'middleware', 'auth.ts'), 'export default () => {}')

    const files = collectProjectSourceFiles(cwd).map(f => path.relative(cwd, f))

    expect(files).toContain('pages/index.vue')
    expect(files).toContain('layouts/default.vue')
    expect(files).not.toContain('middleware/auth.ts')
  })

  it('collects Nuxt 4 app/ directory paths', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-cli-app-'))
    roots.push(cwd)
    writeFile(path.join(cwd, 'app', 'pages', 'index.vue'), '<template></template>')
    writeFile(path.join(cwd, 'app', 'components', 'Card.vue'), '<template></template>')
    writeFile(path.join(cwd, 'app', 'plugins', 'i18n.ts'), 'export default () => {}')
    writeFile(path.join(cwd, 'pages', 'legacy.vue'), '<template></template>')

    const files = collectProjectSourceFiles(cwd).map(f => path.relative(cwd, f))

    expect(files).toContain('app/pages/index.vue')
    expect(files).toContain('app/components/Card.vue')
    expect(files).toContain('app/plugins/i18n.ts')
    expect(files).toContain('pages/legacy.vue')
  })
})
