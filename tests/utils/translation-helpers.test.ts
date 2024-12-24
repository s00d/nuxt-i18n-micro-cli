import { describe, test, expect } from 'vitest'
import {
  normalizeText,
  shouldTranslate,
  generateTranslationKey,
  flattenTranslations,
  toSlug,
} from '../../src/utils/text_converner/translation-helpers'

describe('Translation Helpers', () => {
  describe('normalizeText', () => {
    test('removes extra whitespace', () => {
      expect(normalizeText('  Hello   World  ')).toBe('Hello World')
    })

    test('removes dynamic interpolations', () => {
      expect(normalizeText('Hello ${name}!')).toBe('Hello !')
      expect(normalizeText('Count: {{count}}')).toBe('Count: ')
    })
  })

  describe('shouldTranslate', () => {
    test('returns false for short text', () => {
      expect(shouldTranslate('a')).toBe(false)
    })

    test('returns false for numbers', () => {
      expect(shouldTranslate('123')).toBe(false)
    })

    test('returns false for variable names', () => {
      expect(shouldTranslate('userName')).toBe(false)
    })

    test('returns true for translatable text', () => {
      expect(shouldTranslate('Hello, World!')).toBe(true)
      expect(shouldTranslate('Привет, мир!')).toBe(true)
    })
  })

  describe('generateTranslationKey', () => {
    test('generates unique keys', () => {
      const existingKeys = new Set(['hello_world'])
      expect(generateTranslationKey('Hello, World!', existingKeys))
        .toBe('hello_world_1')
    })

    test('adds context prefix when provided', () => {
      const existingKeys: Set<string> = new Set()
      expect(generateTranslationKey('Hello', existingKeys, 'auth'))
        .toBe('auth.hello')
    })
  })

  describe('flattenTranslations', () => {
    test('flattens nested translations', () => {
      const nested = {
        auth: {
          login: 'Login',
          register: {
            title: 'Register',
            submit: 'Submit',
          },
        },
      }

      const flattened = flattenTranslations(nested)
      expect(flattened.get('auth.login')).toBe('Login')
      expect(flattened.get('auth.register.title')).toBe('Register')
      expect(flattened.get('auth.register.submit')).toBe('Submit')
    })
  })
})

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
