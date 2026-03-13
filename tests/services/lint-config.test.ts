import { describe, expect, it } from 'vitest'
import { buildCustomRegexRules } from '../../src/core/services/LintService'

describe('lint config custom regex rules', () => {
  it('creates regex rules and reports violations', () => {
    const [rule] = buildCustomRegexRules({
      customRegexRules: [
        {
          name: 'no-click-word',
          pattern: '\\bclick\\b',
          flags: 'i',
          replacement: 'tap',
        },
      ],
    })

    expect(rule).toBeDefined()
    expect(rule.check('Press here', { key: 'k', locale: 'en', file: 'f' })).toBe(true)
    expect(rule.check('Click here', { key: 'k', locale: 'en', file: 'f' })).toBe(false)
    expect(rule.fix?.('Click here')).toBe('tap here')
  })

  it('ignores invalid regex definitions', () => {
    const rules = buildCustomRegexRules({
      customRegexRules: [
        {
          name: 'broken',
          pattern: '(',
        },
      ],
    })

    expect(rules).toHaveLength(0)
  })
})
