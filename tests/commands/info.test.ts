import fs from 'node:fs'
import os from 'node:os'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import infoCommand from '../../src/commands/info'
import { getI18nConfig } from '../../src/utils/kit'

// Мокаем все внешние зависимости
vi.mock('fs')
vi.mock('os')
vi.mock('consola')
vi.mock('../../src/utils/kit')
vi.mock('../../src/utils/json')

describe('info command', () => {
  const createCommandContext = (args: Partial<{
    cwd: string
    logLevel: string
    json: boolean
    debug: boolean
  }> = {}) => ({
    args: {
      _: ['info'],
      cwd: process.cwd(),
      logLevel: 'info',
      json: false,
      debug: false,
      ...args,
    },
    rawArgs: [],
    cmd: infoCommand,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем consola
    vi.mocked(consola.info).mockImplementation(vi.fn())
    vi.mocked(consola.warn).mockImplementation(vi.fn())
    vi.mocked(consola.box).mockImplementation(vi.fn())
    vi.mocked(consola.error).mockImplementation(vi.fn())

    // Базовые моки для fs и os
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(os.platform).mockReturnValue('darwin')
    vi.mocked(os.release).mockReturnValue('24.5.0')
    vi.mocked(os.arch).mockReturnValue('arm64')
    vi.mocked(os.cpus).mockReturnValue([{
      model: 'Apple M1',
      speed: 3200,
      times: {
        user: 0,
        nice: 0,
        sys: 0,
        idle: 0,
        irq: 0,
      },
    }])
    vi.mocked(os.totalmem).mockReturnValue(16 * 1024 * 1024 * 1024)
    vi.mocked(os.freemem).mockReturnValue(8 * 1024 * 1024 * 1024)
    vi.mocked(os.homedir).mockReturnValue('/Users/test')
    vi.mocked(os.hostname).mockReturnValue('test-mac')
    vi.mocked(os.loadavg).mockReturnValue([1.5, 1.2, 1.0])
    vi.mocked(os.userInfo).mockReturnValue({
      username: 'testuser',
      uid: 1000,
      gid: 1000,
      shell: '/bin/zsh',
      homedir: '/Users/test',
    })

    // Мокаем getI18nConfig
    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: [
        { code: 'en' },
        { code: 'ru' },
      ],
      defaultLocale: 'en',
      translationDir: 'locales',
    })
  })

  it('should display basic information', async () => {
    const command = infoCommand
    if (!command) throw new Error('Command not found')
    if (!command.run) throw new Error('Command run method not found')

    await command.run(createCommandContext())

    // Проверяем только основные блоки информации
    expect(vi.mocked(consola.box)).toHaveBeenCalledWith('CLI Information')
    expect(vi.mocked(consola.box)).toHaveBeenCalledWith('Project Configuration')
    expect(vi.mocked(consola.box)).toHaveBeenCalledWith('System Information')
  })

  it('should display debug information when debug flag is set', async () => {
    const command = infoCommand
    if (!command) throw new Error('Command not found')
    if (!command.run) throw new Error('Command run method not found')

    await command.run(createCommandContext({ debug: true }))

    expect(vi.mocked(consola.box)).toHaveBeenCalledWith('Debug Information')
  })

  it('should output JSON when json flag is set', async () => {
    const command = infoCommand
    if (!command) throw new Error('Command not found')
    if (!command.run) throw new Error('Command run method not found')

    const consoleSpy = vi.spyOn(console, 'log')

    await command.run(createCommandContext({ json: true }))

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"cli"'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"project"'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"system"'))
  })
})
