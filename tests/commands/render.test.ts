import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import { renderKeyValueTable, renderSection, renderStatus } from '../../src/commands/_render'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('render helpers', () => {
  const originalIsTTY = process.stdout.isTTY

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })
  })

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: originalIsTTY,
    })
  })

  it('renders section in non-tty mode as plain title', () => {
    renderSection('Demo')
    expect(consola.info).toHaveBeenCalledWith('\n== Demo ==')
  })

  it('renders table in non-tty mode as key/value lines', () => {
    renderKeyValueTable([
      ['One', 1],
      ['Two', '2'],
    ])
    expect(consola.info).toHaveBeenCalledWith('One: 1')
    expect(consola.info).toHaveBeenCalledWith('Two: 2')
  })

  it('routes status by level', () => {
    renderStatus('success', 'done')
    renderStatus('warn', 'warn')
    renderStatus('error', 'err')
    renderStatus('info', 'info')

    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('done'))
    expect(consola.warn).toHaveBeenCalledWith(expect.stringContaining('warn'))
    expect(consola.error).toHaveBeenCalledWith(expect.stringContaining('err'))
    expect(consola.info).toHaveBeenCalledWith(expect.stringContaining('info'))
  })
})
