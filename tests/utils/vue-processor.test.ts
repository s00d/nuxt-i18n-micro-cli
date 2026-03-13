import { describe, test, expect } from 'vitest'
import { VueProcessor } from '../../src/core/text_converner/vue-processor'
import { KeyGenerator } from '../../src/core/text_converner/key-generator'
import type { ProcessorContext } from '../../src/core/text_converner/types'

/**
 * Creates a mock processor context for testing with realistic translation key generation
 */
export function createMockContext(): ProcessorContext {
  const translations = new Map<string, string>()
  const keyGenerator = new KeyGenerator(translations, {
    maxLength: 40,
    context: 'test',
  })

  return {
    getOrCreateTranslationKey(text: string, filePath: string, _lines: string[]): string {
      return keyGenerator.generateKey(text, filePath)
    },
  }
}

describe('Vue Processor', () => {
  const processor = new VueProcessor(createMockContext())

  describe('processTemplate', () => {
    test('processes text nodes', () => {
      const template = '<div>Hello, World!</div>'
      const result = processor.processTemplate(template, 'test.vue')
      expect(result).toBe('<div>{{ $t(\'common.test.hello-world\') }}</div>')
    })

    test('processes attributes', () => {
      const template = '<button title="Click me">Button</button>'
      const result = processor.processTemplate(template, 'test.vue')
      expect(result).toBe('<button :title="$t(\'common.test.click-me\')">{{ $t(\'common.test.button\') }}</button>')
    })

    test('skips already translated text', () => {
      const template = '<div>{{ $t("existing.key") }}</div>'
      const result = processor.processTemplate(template, 'test.vue')
      expect(result).toBe(template)
    })

    test('handles multiple elements', () => {
      const template = `
        <div>
          <h1>Title</h1>
          <p>Description</p>
        </div>
      `
      const result = processor.processTemplate(template, 'test.vue')
      expect(result).toContain('$t(\'common.test.title\')')
      expect(result).toContain('$t(\'common.test.description\')')
    })

    test('does not translate text inside HTML comments', () => {
      const template = `
        <!-- Hidden comment text -->
        <div>Visible text</div>
      `
      const result = processor.processTemplate(template, 'test.vue')
      expect(result).toContain('<!-- Hidden comment text -->')
      expect(result).toContain('$t(\'common.test.visible-text\')')
      expect(result).not.toContain('$t(\'common.test.hidden-comment-text\')')
    })
  })
})
