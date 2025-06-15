import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import consola from 'consola'
import type { Mock } from 'vitest'
import validateCommand from '../../src/commands/validate'

// Мокаем process.exit
const originalExit = process.exit
vi.stubGlobal('process', {
  ...process,
  exit: vi.fn(),
})

// Мокаем модули
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}))

vi.mock('../../src/utils/json', () => ({
  loadJsonFile: vi.fn(),
  flattenTranslations: vi.fn(),
}))

vi.mock('../../src/utils/kit', () => ({
  getI18nConfig: vi.fn(),
}))

vi.mock('consola', () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('validate command', () => {
  let loadJsonFile: Mock
  let flattenTranslations: Mock
  let getI18nConfig: Mock

  beforeEach(async () => {
    vi.clearAllMocks()
    const jsonUtils = await import('../../src/utils/json')
    const kitUtils = await import('../../src/utils/kit')
    loadJsonFile = jsonUtils.loadJsonFile as Mock
    flattenTranslations = jsonUtils.flattenTranslations as Mock
    getI18nConfig = kitUtils.getI18nConfig as Mock

    vi.mocked(getI18nConfig).mockResolvedValue({
      locales: [
        { code: 'en' },
        { code: 'ru' },
      ],
      translationDir: 'locales',
    })
  })

  afterAll(() => {
    // Восстанавливаем оригинальный process.exit
    vi.stubGlobal('process', {
      ...process,
      exit: originalExit,
    })
  })

  const createCommandContext = (args: { cwd?: string, translationDir?: string, logLevel?: string }) => ({
    args,
  })

  it('should validate translation files successfully', async () => {
    // Мокаем данные для английского (эталонного) файла
    vi.mocked(loadJsonFile).mockImplementation((path: string) => {
      if (path.includes('en.json')) {
        return {
          common: {
            hello: 'Hello',
            welcome: 'Welcome',
          },
        }
      }
      if (path.includes('ru.json')) {
        return {
          common: {
            hello: 'Привет',
            welcome: 'Добро пожаловать',
          },
        }
      }
      return {}
    })

    // Мокаем плоские ключи для обоих файлов
    vi.mocked(flattenTranslations).mockImplementation((translations: Record<string, unknown>) => {
      const obj = translations as { common: { hello: string, welcome: string } }
      if (obj.common?.hello === 'Hello') {
        return { 'common.hello': 'Hello', 'common.welcome': 'Welcome' }
      }
      return { 'common.hello': 'Привет', 'common.welcome': 'Добро пожаловать' }
    })

    const command = validateCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что не было предупреждений и ошибок
    expect(consola.warn).not.toHaveBeenCalled()
    expect(consola.error).not.toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('All translation files are valid.')
  })

  it('should detect missing keys', async () => {
    // Мокаем данные для английского (эталонного) файла
    vi.mocked(loadJsonFile).mockImplementation((path: string) => {
      if (path.includes('en.json')) {
        return {
          common: {
            hello: 'Hello',
            welcome: 'Welcome',
            goodbye: 'Goodbye',
          },
        }
      }
      if (path.includes('ru.json')) {
        return {
          common: {
            hello: 'Привет',
            welcome: 'Добро пожаловать',
          },
        }
      }
      return {}
    })

    // Мокаем плоские ключи
    vi.mocked(flattenTranslations).mockImplementation((translations: Record<string, unknown>) => {
      const obj = translations as { common: { hello: string, welcome: string, goodbye?: string } }
      if (obj.common?.goodbye) {
        return {
          'common.hello': 'Hello',
          'common.welcome': 'Welcome',
          'common.goodbye': 'Goodbye',
        }
      }
      return {
        'common.hello': 'Привет',
        'common.welcome': 'Добро пожаловать',
      }
    })

    const command = validateCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что было предупреждение об отсутствующих ключах
    expect(consola.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Locale ru is missing keys:\ncommon\.goodbye/),
    )
    expect(consola.error).toHaveBeenCalledWith('Validation failed with errors.')
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should detect extra keys', async () => {
    // Мокаем данные для английского (эталонного) файла
    vi.mocked(loadJsonFile).mockImplementation((path: string) => {
      if (path.includes('en.json')) {
        return {
          common: {
            hello: 'Hello',
            welcome: 'Welcome',
          },
        }
      }
      if (path.includes('ru.json')) {
        return {
          common: {
            hello: 'Привет',
            welcome: 'Добро пожаловать',
            goodbye: 'До свидания',
          },
        }
      }
      return {}
    })

    // Мокаем плоские ключи
    vi.mocked(flattenTranslations).mockImplementation((translations: Record<string, unknown>) => {
      const obj = translations as { common: { hello: string, welcome: string, goodbye?: string } }
      if (obj.common?.goodbye) {
        return {
          'common.hello': 'Привет',
          'common.welcome': 'Добро пожаловать',
          'common.goodbye': 'До свидания',
        }
      }
      return {
        'common.hello': 'Hello',
        'common.welcome': 'Welcome',
      }
    })

    const command = validateCommand as any
    if (command.run) await command.run(createCommandContext({}))

    // Проверяем, что было предупреждение о лишних ключах
    expect(consola.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Locale ru has extra keys:\ncommon\.goodbye/),
    )
    expect(consola.error).toHaveBeenCalledWith('Validation failed with errors.')
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should handle invalid JSON files', async () => {
    vi.mocked(loadJsonFile).mockImplementation(() => {
      throw new Error('Invalid JSON')
    })

    const command = validateCommand as any
    let error: Error | undefined

    try {
      if (command.run) await command.run(createCommandContext({}))
    }
    catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
    expect(error?.message).toBe('Invalid JSON')
  })

  it('should handle custom translation directory', async () => {
    // Мокаем данные для английского (эталонного) файла
    vi.mocked(loadJsonFile).mockImplementation((path: string) => {
      if (path.includes('custom/en.json')) {
        return {
          common: {
            hello: 'Hello',
            welcome: 'Welcome',
          },
        }
      }
      if (path.includes('custom/ru.json')) {
        return {
          common: {
            hello: 'Привет',
            welcome: 'Добро пожаловать',
          },
        }
      }
      return {}
    })

    // Мокаем плоские ключи для обоих файлов
    vi.mocked(flattenTranslations).mockImplementation((translations: Record<string, unknown>) => {
      const obj = translations as { common: { hello: string, welcome: string } }
      if (obj.common?.hello === 'Hello') {
        return { 'common.hello': 'Hello', 'common.welcome': 'Welcome' }
      }
      return { 'common.hello': 'Привет', 'common.welcome': 'Добро пожаловать' }
    })

    const command = validateCommand as any
    if (command.run) await command.run(createCommandContext({
      translationDir: 'custom',
    }))

    // Проверяем, что loadJsonFile вызывался с правильными путями
    expect(loadJsonFile).toHaveBeenCalledWith(expect.stringContaining('custom/en.json'))
    expect(loadJsonFile).toHaveBeenCalledWith(expect.stringContaining('custom/ru.json'))
    expect(consola.success).toHaveBeenCalledWith('All translation files are valid.')
  })
})
