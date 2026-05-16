import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CliError } from '../../src/core/errors/CliError'
import { I18nConfigError } from '../../src/core/errors/I18nConfigError'
import { normalizeCliError } from '../../src/core/errors/normalize-error'
import { handleCliError } from '../../src/core/utils/cli-error'

vi.mock('consola', () => ({
  consola: {
    error: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  },
}))

describe('handleCliError', () => {
  const originalNoColor = process.env.NO_COLOR

  beforeEach(() => {
    vi.clearAllMocks()
    process.exitCode = 0
    process.env.NO_COLOR = '1'
  })

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR
    }
    else {
      process.env.NO_COLOR = originalNoColor
    }
  })

  it('prints hints for I18nConfigError without stack by default', async () => {
    const { consola } = await import('consola')
    const error = new I18nConfigError({
      code: 'NOT_NUXT_PROJECT',
      cwd: '/tmp/demo',
      message: 'No Nuxt project found for i18n-micro.',
      hints: [
        'Run this command inside a Nuxt app directory.',
      ],
    })

    handleCliError(error, ['node', 'i18n-micro', 'search'])

    expect(consola.error).toHaveBeenCalledWith('No Nuxt project found for i18n-micro.')
    expect(consola.info).toHaveBeenCalledWith('Working directory: /tmp/demo')
    expect(consola.info).toHaveBeenCalledWith('Run this command inside a Nuxt app directory.')
    expect(process.exitCode).toBe(1)
  })

  it('prints hints for generic CliError', async () => {
    const { consola } = await import('consola')
    const error = new CliError({
      code: 'VALIDATION_ERROR',
      message: 'limit must be a positive integer',
      hints: ['Example: i18n-micro search "text" --limit 20'],
    })

    handleCliError(error)

    expect(consola.error).toHaveBeenCalledWith('limit must be a positive integer')
    expect(consola.info).toHaveBeenCalledWith('Example: i18n-micro search "text" --limit 20')
  })

  it('normalizes ENOENT errors with file hints', () => {
    const normalized = normalizeCliError(Object.assign(new Error('ENOENT'), {
      code: 'ENOENT',
      path: '/tmp/missing.json',
    }))

    expect(normalized.code).toBe('FILE_NOT_FOUND')
    expect(normalized.hints.length).toBeGreaterThan(0)
    expect(normalized.details.Path).toBe('/tmp/missing.json')
  })

  it('normalizes plain errors with debug hint', () => {
    const normalized = normalizeCliError(new Error('Something went wrong'))

    expect(normalized.code).toBe('COMMAND_FAILED')
    expect(normalized.message).toBe('Something went wrong')
    expect(normalized.hints).toContain('Run with --debug for a stack trace.')
  })

  it('uses colored log output when terminal colors are supported', async () => {
    delete process.env.NO_COLOR
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: true,
    })

    const { consola } = await import('consola')
    const error = new CliError({
      code: 'VALIDATION_ERROR',
      message: 'limit must be a positive integer',
      hints: ['Example: i18n-micro search "text" --limit 20'],
      details: { Limit: '0' },
    })

    handleCliError(error)

    const errorArg = vi.mocked(consola.error).mock.calls[0]?.[0]
    expect(typeof errorArg === 'string' && errorArg.includes('\u001B')).toBe(true)
    expect(consola.log).toHaveBeenCalledWith(expect.stringMatching(/→/))
    expect(consola.info).not.toHaveBeenCalled()
  })
})
