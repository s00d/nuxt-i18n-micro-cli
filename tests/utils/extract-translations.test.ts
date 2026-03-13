import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { extractTranslations } from '../../src/core/utils/components'

describe('extractTranslations fixture project', () => {
  test('matches snapshot for global and page-specific keys', () => {
    const cwd = path.resolve('tests/fixtures/extract-project')
    const result = extractTranslations(cwd)

    const serialized = {
      global: [...result.global].sort(),
      pageSpecific: Object.fromEntries(
        Object.entries(result.pageSpecific)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([scope, keys]) => [scope, [...keys].sort()]),
      ),
      warnings: result.warnings
        .map(w => ({
          file: w.file.replace(cwd, '<cwd>'),
          expression: w.expression,
        }))
        .sort((a, b) => `${a.file}:${a.expression}`.localeCompare(`${b.file}:${b.expression}`)),
    }

    expect(serialized).toMatchSnapshot()
  })
})
