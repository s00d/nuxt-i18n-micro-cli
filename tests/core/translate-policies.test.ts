import { beforeEach, describe, expect, it, vi } from 'vitest'
import { translateBatchTexts, translateText } from '../../src/core/translate'

const state = vi.hoisted(() => ({
  singleAttempts: 0,
  batchAttempts: 0,
  activeParallel: 0,
  maxParallel: 0,
  maskedInputs: [] as string[],
  maskedBatchInputs: [] as string[][],
}))

vi.mock('../../src/core/translate/TranslatorRegistry', () => ({
  default: {
    mock: class {
      async translate(text: string): Promise<string> {
        state.singleAttempts += 1
        if (state.singleAttempts === 1) {
          throw new Error('temporary-failure')
        }
        return `ok:${text}`
      }

      async translateBatch(texts: string[]): Promise<string[]> {
        state.batchAttempts += 1
        if (state.batchAttempts === 1) {
          throw new Error('batch-failure')
        }
        return texts.map(text => `ok:${text}`)
      }
    },
    slow: class {
      async translate(): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 60))
        return 'late'
      }
    },
    nobatch: class {
      async translate(text: string): Promise<string> {
        state.activeParallel += 1
        state.maxParallel = Math.max(state.maxParallel, state.activeParallel)
        await new Promise(resolve => setTimeout(resolve, 20))
        state.activeParallel -= 1
        return `ok:${text}`
      }
    },
    mask: class {
      async translate(text: string): Promise<string> {
        state.maskedInputs.push(text)
        return `tr:${text}`
      }
    },
    maskbatch: class {
      async translateBatch(texts: string[]): Promise<string[]> {
        state.maskedBatchInputs.push(texts)
        return texts.map(text => `tr:${text}`)
      }
    },
  },
}))

describe('translate retry and timeout policies', () => {
  beforeEach(() => {
    state.singleAttempts = 0
    state.batchAttempts = 0
    state.activeParallel = 0
    state.maxParallel = 0
    state.maskedInputs = []
    state.maskedBatchInputs = []
  })

  it('retries single translation when retryCount is provided', async () => {
    const result = await translateText(
      'hello',
      'en',
      'ru',
      'mock',
      'token',
      { retryCount: '1' },
    )

    expect(result).toBe('ok:hello')
    expect(state.singleAttempts).toBe(2)
  })

  it('retries batch translation when retryCount is provided', async () => {
    const result = await translateBatchTexts(
      ['a', 'b'],
      'en',
      'ru',
      'mock',
      'token',
      { retryCount: '1' },
    )

    expect(result).toEqual(['ok:a', 'ok:b'])
    expect(state.batchAttempts).toBe(2)
  })

  it('times out translation when requestTimeoutMs is exceeded', async () => {
    await expect(translateText(
      'hello',
      'en',
      'ru',
      'slow',
      'token',
      { requestTimeoutMs: '10' },
    )).rejects.toThrow()
  })

  it('limits fallback batch parallelism when batchConcurrency is provided', async () => {
    const result = await translateBatchTexts(
      ['a', 'b', 'c', 'd', 'e', 'f'],
      'en',
      'ru',
      'noBatch',
      'token',
      { batchConcurrency: '2' },
    )

    expect(result).toEqual(['ok:a', 'ok:b', 'ok:c', 'ok:d', 'ok:e', 'ok:f'])
    expect(state.maxParallel).toBeLessThanOrEqual(2)
  })

  it('protects placeholders and preserves plural separators for single translation', async () => {
    const result = await translateText(
      'No items | {count} item | %{count} items | @:common.save',
      'en',
      'ru',
      'mask',
      'token',
    )

    expect(state.maskedInputs).toEqual([
      'No items',
      '<v0/> item',
      '<v0/> items',
      '<v0/>',
    ])
    expect(result).toBe('tr:No items | tr:{count} item | tr:%{count} items | tr:@:common.save')
  })

  it('protects placeholders for batch translation and restores after response', async () => {
    const result = await translateBatchTexts(
      ['Hello {name}', 'No items | {count} items'],
      'en',
      'ru',
      'maskbatch',
      'token',
    )

    expect(state.maskedBatchInputs).toEqual([
      ['Hello <v0/>', 'No items', '<v0/> items'],
    ])
    expect(result).toEqual([
      'tr:Hello {name}',
      'tr:No items | tr:{count} items',
    ])
  })

  it('supports custom plural separator from options', async () => {
    const result = await translateText(
      'No items || {count} items',
      'en',
      'ru',
      'mask',
      'token',
      { pluralSeparator: '||' },
    )

    expect(state.maskedInputs).toEqual(['No items', '<v0/> items'])
    expect(result).toBe('tr:No items || tr:{count} items')
  })
})
