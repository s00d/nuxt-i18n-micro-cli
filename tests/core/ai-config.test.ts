import { describe, expect, it } from 'vitest'
import {
  isLlmTranslationService,
  resolveAiTranslationConfig,
} from '../../src/core/translate/ai/config'

describe('ai translation config', () => {
  it('detects only ai llm service', () => {
    expect(isLlmTranslationService('ai')).toBe(true)
    expect(isLlmTranslationService('openai')).toBe(false)
    expect(isLlmTranslationService('google')).toBe(false)
  })

  it('defaults to gateway provider and model', () => {
    expect(resolveAiTranslationConfig()).toMatchObject({
      provider: 'gateway',
      model: 'anthropic/claude-sonnet-4.5',
    })
  })

  it('resolves custom provider and model', () => {
    expect(resolveAiTranslationConfig({
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxTokens: 500,
    })).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.2,
      topP: undefined,
    })
  })

  it('requires model for non-gateway providers', () => {
    expect(() => resolveAiTranslationConfig({ provider: 'openai' })).toThrow(/model/)
  })
})
