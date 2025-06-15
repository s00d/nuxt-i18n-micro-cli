import type { PathLike } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import consola from 'consola'
import checkDuplicatesCommand from '../../src/commands/check-duplicates'

// Мокаем модули
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn((path: PathLike) => {
      if (path.toString().includes('/non-existent')) return false
      return true
    }),
    readdirSync: vi.fn((path: PathLike) => {
      if (path.toString().includes('/pages')) return ['page1', 'page2']
      return ['en.json', 'ru.json']
    }),
  },
}))

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn((path: string) => {
    if (path.includes('invalid')) {
      consola.error('Error loading translation file:', new Error('Invalid JSON'))
      return {}
    }
    if (path.includes('en.json') && !path.includes('pages')) {
      return {
        greeting: 'Hello',
        welcome: 'Hello',
        nested: {
          message: 'Hello',
        },
      }
    }
    if (path.includes('ru.json')) {
      return {
        greeting: 'Привет',
        welcome: 'Привет',
      }
    }
    if (path.includes('pages/page1/en.json')) {
      return {
        title: 'Hello',
        greeting: 'Hello',
        welcome: 'Hello',
        nested: {
          message: 'Hello',
        },
      }
    }
    if (path.includes('pages/page2/en.json')) {
      return {
        greeting: 'Hello',
        welcome: 'Hello',
        nested: {
          message: 'Hello',
        },
      }
    }
    return {}
  }),
  flattenTranslations: vi.fn((obj: any) => {
    const result: Record<string, string> = {}
    const flatten = (o: any, prefix = '') => {
      for (const key in o) {
        const value = o[key]
        if (typeof value === 'object' && value !== null) {
          flatten(value, prefix ? `${prefix}.${key}` : key)
        }
        else {
          result[prefix ? `${prefix}.${key}` : key] = value
        }
      }
    }
    flatten(obj)
    return result
  }),
}))

vi.mock('../../src/utils/kit', () => {
  const mockTranslationDir = '/path/to/translations'
  return {
    getI18nConfig: vi.fn().mockResolvedValue({
      locales: [
        { code: 'en', name: 'English' },
        { code: 'ru', name: 'Russian' },
      ],
      translationDir: mockTranslationDir,
    }),
  }
})

// Мокаем consola
vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('check-duplicates command', () => {
  const mockTranslationDir = '/path/to/translations'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createCommandContext = ({ cwd = '/test', translationDir = mockTranslationDir, logLevel = 'info' } = {}) => {
    const command = checkDuplicatesCommand as any
    return {
      args: { cwd, translationDir, logLevel },
      command,
    }
  }

  it('should check for duplicates in global translations', async () => {
    const command = checkDuplicatesCommand as any
    if (command.run) await command.run(createCommandContext({}))

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Hello" found in locale en:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - greeting')
    expect(infoCalls).toContain(' - global - welcome')
    expect(infoCalls).toContain(' - global - nested.message')
  })

  it('should check for duplicates in nested translations', async () => {
    const command = checkDuplicatesCommand as any
    if (command.run) await command.run(createCommandContext({}))

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Hello" found in locale en:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - nested.message')
  })

  it('should check for duplicates across global and page translations', async () => {
    const command = checkDuplicatesCommand as any
    if (command.run) await command.run(createCommandContext({}))

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Hello" found in locale en:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - greeting')
    expect(infoCalls).toContain(' - global - welcome')
    expect(infoCalls).toContain(' - global - nested.message')
    expect(infoCalls).toContain(' - pages/page1 - title')
    expect(infoCalls).toContain(' - pages/page1 - greeting')
    expect(infoCalls).toContain(' - pages/page1 - welcome')
    expect(infoCalls).toContain(' - pages/page1 - nested.message')
    expect(infoCalls).toContain(' - pages/page2 - greeting')
    expect(infoCalls).toContain(' - pages/page2 - welcome')
    expect(infoCalls).toContain(' - pages/page2 - nested.message')
  })

  it('should check all locales for duplicates', async () => {
    const command = checkDuplicatesCommand as any
    if (command.run) await command.run(createCommandContext({}))

    expect(consola.warn).toHaveBeenCalledWith(
      'Duplicate translation value "Привет" found in locale ru:',
    )
    const infoCalls = vi.mocked(consola.info).mock.calls.map(call => call[0])
    expect(infoCalls).toContain(' - global - greeting')
    expect(infoCalls).toContain(' - global - welcome')
  })
})
