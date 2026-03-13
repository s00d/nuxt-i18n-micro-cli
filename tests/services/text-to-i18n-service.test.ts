import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { runTextToI18n } from '../../src/core/services/TextToI18nService'
import { flattenTranslations } from '../../src/core/utils/json'

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

describe('runTextToI18n extract-only precedence', () => {
  test('applies exclusion > include patterns > directories', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-service-'))
    const translationFile = path.join(tempRoot, 'locales', 'en.json')
    const rewriteFile = path.join(tempRoot, 'components', 'rewrite.ts')
    const extractOnlyFile = path.join(tempRoot, 'components', 'extract-only.ts')
    const pluginFile = path.join(tempRoot, 'plugins', 'notify.ts')

    writeFile(translationFile, '{}')
    writeFile(rewriteFile, 'const title = \'Rewrite target\'\n')
    writeFile(extractOnlyFile, 'const subtitle = \'Extract only target\'\n')
    writeFile(pluginFile, 'const pluginText = \'Plugin target\'\n')

    const result = runTextToI18n({
      cwd: tempRoot,
      translationFile,
      dryRun: false,
      verbose: false,
      extractOnlyDirectories: ['plugins'],
      extractOnlyPatterns: ['components/**/*.ts', '!**/components/rewrite.ts'],
    })

    const rewriteOutput = fs.readFileSync(rewriteFile, 'utf8')
    const extractOnlyOutput = fs.readFileSync(extractOnlyFile, 'utf8')
    const pluginOutput = fs.readFileSync(pluginFile, 'utf8')
    const savedTranslations = JSON.parse(fs.readFileSync(translationFile, 'utf8')) as Record<string, unknown>
    const flat = flattenTranslations(savedTranslations)
    const extractedValues = Object.values(flat)

    expect(result.newTranslations.size).toBe(3)
    expect(rewriteOutput).toContain('{{ $t(')
    expect(extractOnlyOutput).toContain('Extract only target')
    expect(extractOnlyOutput).not.toContain('{{ $t(')
    expect(pluginOutput).toContain('Plugin target')
    expect(pluginOutput).not.toContain('{{ $t(')
    expect(extractedValues).toContain('Rewrite target')
    expect(extractedValues).toContain('Extract only target')
    expect(extractedValues).toContain('Plugin target')
  })

  test('applies precedence with customPath for file and directory processing', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-service-custom-path-'))
    const translationFile = path.join(tempRoot, 'locales', 'en.json')
    const featureDir = path.join(tempRoot, 'features')
    const rewriteFile = path.join(featureDir, 'rewrite.ts')
    const extractOnlyFile = path.join(featureDir, 'extract-only.ts')
    const untouchedFile = path.join(tempRoot, 'outside.ts')

    writeFile(translationFile, '{}')
    writeFile(rewriteFile, 'const title = \'Rewrite in custom path\'\n')
    writeFile(extractOnlyFile, 'const subtitle = \'Extract-only in custom path\'\n')
    writeFile(untouchedFile, 'const outside = \'Outside scope\'\n')

    const fileResult = runTextToI18n({
      cwd: tempRoot,
      translationFile,
      dryRun: false,
      verbose: false,
      customPath: path.relative(tempRoot, rewriteFile),
      extractOnlyDirectories: ['plugins'],
      extractOnlyPatterns: ['features/**/*.ts', '!**/features/rewrite.ts'],
    })

    expect(fileResult.processedFiles).toBe(1)
    expect(fs.readFileSync(rewriteFile, 'utf8')).toContain('{{ $t(')
    expect(fs.readFileSync(extractOnlyFile, 'utf8')).toContain('Extract-only in custom path')
    expect(fs.readFileSync(untouchedFile, 'utf8')).toContain('Outside scope')

    const dirResult = runTextToI18n({
      cwd: tempRoot,
      translationFile,
      dryRun: false,
      verbose: false,
      customPath: path.relative(tempRoot, featureDir),
      extractOnlyDirectories: ['plugins'],
      extractOnlyPatterns: ['features/**/*.ts', '!**/features/rewrite.ts'],
    })

    const rewriteOutput = fs.readFileSync(rewriteFile, 'utf8')
    const extractOnlyOutput = fs.readFileSync(extractOnlyFile, 'utf8')
    const untouchedOutput = fs.readFileSync(untouchedFile, 'utf8')
    const savedTranslations = JSON.parse(fs.readFileSync(translationFile, 'utf8')) as Record<string, unknown>
    const flat = flattenTranslations(savedTranslations)
    const extractedValues = Object.values(flat)

    expect(dirResult.processedFiles).toBe(2)
    expect(rewriteOutput).toContain('{{ $t(')
    expect(extractOnlyOutput).not.toContain('{{ $t(')
    expect(extractOnlyOutput).toContain('Extract-only in custom path')
    expect(untouchedOutput).toContain('Outside scope')
    expect(extractedValues).toContain('Rewrite in custom path')
    expect(extractedValues).toContain('Extract-only in custom path')
    expect(extractedValues).not.toContain('Outside scope')
  })

  test('applies key overrides and skipped keys', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-service-interactive-'))
    const translationFile = path.join(tempRoot, 'locales', 'en.json')
    const sourceFile = path.join(tempRoot, 'components', 'card.ts')

    writeFile(translationFile, '{}')
    writeFile(sourceFile, 'const title = \'Welcome\'\nconst subtitle = \'Subtitle\'\n')

    const result = runTextToI18n({
      cwd: tempRoot,
      translationFile,
      dryRun: false,
      verbose: false,
      keyOverrides: {
        'components.card.welcome': 'home.hero.title',
      },
      skippedKeys: ['components.card.subtitle'],
    })

    const sourceOutput = fs.readFileSync(sourceFile, 'utf8')
    const savedTranslations = JSON.parse(fs.readFileSync(translationFile, 'utf8')) as Record<string, unknown>
    const flat = flattenTranslations(savedTranslations)
    const extractedValues = Object.values(flat)

    expect(result.newTranslations.has('home.hero.title')).toBe(true)
    expect(result.newTranslations.has('components.card.subtitle')).toBe(false)
    expect(sourceOutput).toContain('$t(\'home.hero.title\')')
    expect(sourceOutput).toContain('Subtitle')
    expect(sourceOutput).not.toContain('$t(\'components.card.subtitle\')')
    expect(extractedValues).toContain('Welcome')
    expect(extractedValues).not.toContain('Subtitle')
  })
})
