import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { FileProcessor } from '../../src/core/text_converner/file-processor'

describe('FileProcessor regular files', () => {
  test('does not translate comments or module paths from fixture file', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/basic-input.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('import foo from \'foo-lib\'')
    expect(output).toContain('const pkg = require(\'bar-lib\')')
    expect(output).toContain('// "Do not translate me"')
    expect(output).toContain('{{ $t(')
    expect(values).toEqual(['Save changes'])
  })

  test('does not translate member access key in bracket notation but translates assigned values', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/member-access.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('obj[\'label\']')
    expect(output).toContain('{{ $t(')
    expect(values).toContain('Save')
    expect(values).toContain('Cancel')
    expect(values).not.toContain('label')
  })

  test('processes TSX string literals and keeps JSX structure', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/component.tsx')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('<button')
    expect(output).toContain('title=')
    expect(values).toContain('Save')
    expect(values).toContain('Click me')
  })

  test('does not translate enum and const object schema values', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/schema.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('Ready = \'ready\'')
    expect(output).toContain('home: \'/home\'')
    expect(values).toEqual([])
  })

  test('processes JSX fixtures and captures text + attributes', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/component.jsx')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('<h2')
    expect(output).toContain('title=')
    expect(output).toContain('{ $t(')
    expect(values).toContain('Dashboard title')
    expect(values).toContain('Dashboard')
    expect(values).toContain('Welcome back')
  })

  test('skips nested enum/const schema strings but translates runtime UI text', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/nested-schema.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('NotFound = \'not_found\'')
    expect(output).toContain('path: \'/api/login\'')
    expect(output).toContain('required: \'authorization\'')
    expect(values).toContain('Save profile')
    expect(values).not.toContain('not_found')
    expect(values).not.toContain('/api/login')
    expect(values).not.toContain('authorization')
  })

  test('translates user-facing strings in runtime const objects', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/runtime-const-object.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toMatchSnapshot()
    expect(output).toContain('{{ $t(')
    expect(values).toContain('Save')
    expect(values).toContain('Cancel')
  })

  test('handles larger mixed fixture while preserving imports/require/comments', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/large-mixed.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('import type { RouteLocationRaw } from \'vue-router\'')
    expect(output).toContain('const moduleId = require(\'./feature-module\')')
    expect(output).toContain('// "do not touch this comment"')
    expect(values).toContain('Operation completed')
    expect(values).toContain('Operation failed')
    expect(values).toContain('Please review\nand confirm')
    expect(values).toContain('Continue')
    expect(values).toContain('Everything is fine')
    expect(values).toContain('Something went wrong')
    expect(values).not.toContain('/profile')
  })

  test('processes large vue fixture and matches snapshot output', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/mega-page.vue')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toMatchSnapshot()
    expect(values).toContain('Application settings')
    expect(values).toContain('Save all changes')
    expect(values).toContain('Need help? Contact support.')
    expect(values).not.toContain('/settings')
    expect(values).not.toContain('update_settings')
  })

  test('processes 200+ lines TSX stress fixture and matches snapshot output', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/stress-dashboard.tsx')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toMatchSnapshot()
    expect(values).toContain('Operations dashboard')
    expect(values).toContain('Open detailed report')
    expect(values).toContain('Data is refreshed every 15 minutes.')
    expect(values).not.toContain('/dashboard')
    expect(values).not.toContain('/api/v1')
    expect(values).not.toContain('ready')
  })

  test('processes Nuxt plugin fixture strings', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/nuxt-plugin.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('defineNuxtPlugin')
    expect(output).not.toContain('{{ $t(')
    expect(values).toContain('Plugin initialized')
    expect(values).toContain('Sync completed successfully')
  })

  test('processes Vue plugin fixture strings', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/vue-plugin.ts')
    const processor = new FileProcessor({}, { context: 'test' })
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('install(app: App)')
    expect(output).not.toContain('{{ $t(')
    expect(values).toContain('Vue plugin ready')
    expect(values).toContain('Injecting global helpers')
  })

  test('supports custom extract-only directories', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/hooks/notifier.ts')
    const processor = new FileProcessor(
      {},
      {
        context: 'test',
        extractOnlyDirectories: ['hooks'],
      },
    )
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('const title = \'Hook title\'')
    expect(output).toContain('const body = \'Hook body\'')
    expect(output).not.toContain('{{ $t(')
    expect(values).toContain('Hook title')
    expect(values).toContain('Hook body')
  })

  test('supports extract-only file patterns', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/custom/notifier.ts')
    const processor = new FileProcessor(
      {},
      {
        context: 'test',
        baseDir: path.resolve('tests/fixtures/text-to-i18n'),
        extractOnlyPatterns: ['**/custom/**/*.ts'],
      },
    )
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('const title = \'Custom notifier title\'')
    expect(output).toContain('const body = \'Custom notifier body\'')
    expect(output).not.toContain('{{ $t(')
    expect(values).toContain('Custom notifier title')
    expect(values).toContain('Custom notifier body')
  })

  test('exclusion pattern overrides extract-only directory', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/nuxt-plugin.ts')
    const processor = new FileProcessor(
      {},
      {
        context: 'test',
        baseDir: path.resolve('tests/fixtures/text-to-i18n'),
        extractOnlyDirectories: ['plugins'],
        extractOnlyPatterns: ['!**/nuxt-plugin.ts'],
      },
    )
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('{{ $t(')
    expect(values).toContain('Plugin initialized')
    expect(values).toContain('Sync completed successfully')
  })

  test('exclusion pattern overrides extract-only include pattern', () => {
    const filePath = path.resolve('tests/fixtures/text-to-i18n/custom/notifier.ts')
    const processor = new FileProcessor(
      {},
      {
        context: 'test',
        baseDir: path.resolve('tests/fixtures/text-to-i18n'),
        extractOnlyPatterns: ['**/custom/**/*.ts', '!**/custom/notifier.ts'],
      },
    )
    const output = processor.processFile(filePath)
    const values = [...processor.getNewTranslations().values()].map(item => item.value)

    expect(output).toContain('{{ $t(')
    expect(values).toContain('Custom notifier title')
    expect(values).toContain('Custom notifier body')
  })
})
