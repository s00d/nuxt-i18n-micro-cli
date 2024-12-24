import { describe, test, expect } from 'vitest'
import { TEXT_PATTERNS, TEMPLATE_EXPRESSIONS } from '../../src/utils/text_converner/text-patterns'

describe('Text Patterns', () => {
  describe('QUOTED_TEXT', () => {
    test('matches single quoted text', () => {
      const text = 'const message = \'Hello, World!\''
      const matches = [...text.matchAll(TEXT_PATTERNS.QUOTED_TEXT)]
      expect(matches[0][2]).toBe('Hello, World!')
    })

    test('matches double quoted text', () => {
      const text = 'const message = "Hello, World!"'
      const matches = [...text.matchAll(TEXT_PATTERNS.QUOTED_TEXT)]
      expect(matches[0][2]).toBe('Hello, World!')
    })

    test('matches template literals', () => {
      const text = 'const message = `Hello, World!`'
      const matches = [...text.matchAll(TEXT_PATTERNS.QUOTED_TEXT)]
      expect(matches[0][2]).toBe('Hello, World!')
    })
  })

  describe('VUE_TEMPLATE_TEXT', () => {
    test('matches text between tags', () => {
      const template = '<div>Hello, World!</div>'
      const matches = [...template.matchAll(TEXT_PATTERNS.VUE_TEMPLATE_TEXT)]
      expect(matches[0][1].trim()).toBe('Hello, World!')
    })
  })

  describe('ATTRIBUTE_TEXT', () => {
    test('matches title attribute', () => {
      const html = '<button title="Click me">Button</button>'
      const matches = [...html.matchAll(TEXT_PATTERNS.ATTRIBUTE_TEXT)]
      expect(matches[0][2]).toBe('Click me')
    })

    test('matches placeholder attribute', () => {
      const html = '<input placeholder="Enter your name">'
      const matches = [...html.matchAll(TEXT_PATTERNS.ATTRIBUTE_TEXT)]
      expect(matches[0][2]).toBe('Enter your name')
    })
  })
})

describe('Template Expressions', () => {
  test('identifies translation expressions', () => {
    const text = '{{ $t("hello.world") }}'
    expect(TEMPLATE_EXPRESSIONS.TRANSLATION.test(text)).toBe(true)
  })

  test('identifies curly expressions', () => {
    const text = '{{ someVariable }}'
    expect(TEMPLATE_EXPRESSIONS.CURLY_EXPRESSIONS.test(text)).toBe(true)
  })
})
