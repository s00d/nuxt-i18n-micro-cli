import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  formatErrorDetail,
  formatErrorHeadline,
  formatErrorHint,
  supportsTerminalColors,
} from '../../src/core/utils/terminal-colors'

describe('supportsTerminalColors', () => {
  const originalEnv = { ...process.env }
  const originalIsTTY = process.stdout.isTTY

  beforeEach(() => {
    process.env = { ...originalEnv }
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: true,
    })
  })

  afterEach(() => {
    process.env = originalEnv
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: originalIsTTY,
    })
  })

  it('returns false when NO_COLOR is set', () => {
    delete process.env.FORCE_COLOR
    process.env.NO_COLOR = '1'
    expect(supportsTerminalColors()).toBe(false)
  })

  it('prefers FORCE_COLOR over NO_COLOR', () => {
    process.env.NO_COLOR = '1'
    process.env.FORCE_COLOR = '1'
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })
    expect(supportsTerminalColors()).toBe(true)
  })

  it('returns true when FORCE_COLOR is set', () => {
    delete process.env.NO_COLOR
    process.env.FORCE_COLOR = '1'
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })
    expect(supportsTerminalColors()).toBe(true)
  })

  it('returns false for non-tty stdout without FORCE_COLOR', () => {
    delete process.env.NO_COLOR
    delete process.env.FORCE_COLOR
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })
    expect(supportsTerminalColors()).toBe(false)
  })
})

describe('error formatting', () => {
  const originalIsTTY = process.stdout.isTTY

  beforeEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: true,
    })
    delete process.env.NO_COLOR
    delete process.env.FORCE_COLOR
  })

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: originalIsTTY,
    })
  })

  it('adds ANSI codes when colors are supported', () => {
    const headline = formatErrorHeadline('NOT_NUXT_PROJECT', 'No Nuxt project found.')
    expect(headline).toContain('NOT_NUXT_PROJECT')
    expect(headline.includes('\u001B')).toBe(true)

    const detail = formatErrorDetail('Working directory', '/tmp/demo')
    expect(detail).toContain('/tmp/demo')
    expect(detail.includes('\u001B')).toBe(true)

    const hint = formatErrorHint('Run inside a Nuxt app.')
    expect(hint).toContain('→')
    expect(hint.includes('\u001B')).toBe(true)
  })

  it('returns plain text when colors are disabled', () => {
    process.env.NO_COLOR = '1'

    expect(formatErrorHeadline('CODE', 'Message')).toBe('Message')
    expect(formatErrorDetail('Label', 'value')).toBe('Label: value')
    expect(formatErrorHint('hint')).toBe('hint')
  })
})
