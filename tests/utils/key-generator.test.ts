import { describe, test, expect } from 'vitest'
import { toSlug } from '../../src/utils/text_converner/translation-helpers'

describe('String Helpers', () => {
  describe('toSlug', () => {
    test('converts text to URL-friendly slug', () => {
      expect(toSlug('Hello World!')).toBe('hello-world')
      expect(toSlug('Привет, мир!')).toBe('privet-mir')
      expect(toSlug('Special & Characters')).toBe('special-and-characters')
    })

    test('handles multiple spaces and special characters', () => {
      expect(toSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
      expect(toSlug('!@#$%^&*()')).toBe('dollarpercentand')
    })
  })
})
