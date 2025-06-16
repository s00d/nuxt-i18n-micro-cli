import * as fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { consola } from 'consola'
import { resolve } from 'pathe'
import { loadJsonFile, writeJsonFile } from '../../src/utils/json'
import lintCommand from '../../src/commands/lint'
import { getI18nConfig } from '../../src/utils/kit'

// Мокаем модули
vi.mock('consola')
vi.mock('node:fs')
vi.mock('../../src/utils/json')
vi.mock('../../src/utils/kit', () => ({
  getI18nConfig: vi.fn().mockResolvedValue({
    locales: [
      { code: 'en' },
      { code: 'ru' },
    ],
    defaultLocale: 'en',
    translationDir: 'locales',
  }),
}))

const mockCwd = '/test/project'

// Создаем контекст команды
const createCommandContext = (args: {
  fix?: boolean
  rules?: string
  translationDir?: string
  logLevel?: string
}) => ({
  args: {
    _: [],
    cwd: mockCwd,
    translationDir: args.translationDir || 'locales',
    rules: args.rules || '',
    fix: args.fix || false,
    logLevel: args.logLevel || 'info',
  },
  rawArgs: [],
  cmd: lintCommand,
})

// Валидные переводы для тестов
const validTranslations = {
  welcome: 'Добро пожаловать!',
  greeting: 'Привет, мир!',
  description: 'Это тестовый перевод.',
  nested: {
    key: 'Вложенный ключ.',
    another: 'Еще один перевод.',
  },
}

describe('lint command', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем process.cwd
    vi.spyOn(process, 'cwd').mockReturnValue(mockCwd)

    // Мокаем fs.existsSync для проверки существования директорий и файлов
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (typeof path === 'string') {
        const resolvedPath = resolve(mockCwd, path)
        // Всегда возвращаем true для директории переводов и файлов
        if (resolvedPath === resolve(mockCwd, 'locales')
          || resolvedPath === resolve(mockCwd, '/custom/translations')
          || resolvedPath.endsWith('.json')) {
          return true
        }
      }
      return false
    })

    // Мокаем loadJsonFile для возврата тестовых данных
    vi.mocked(loadJsonFile).mockReturnValue(validTranslations)

    // Мокаем writeJsonFile
    vi.mocked(writeJsonFile).mockImplementation(() => {})
  })

  it('should check all rules by default', async () => {
    const command = lintCommand
    if (!command?.run) throw new Error('Command not found')
    await expect(command.run(createCommandContext({}))).resolves.not.toThrow()
  })

  it('should check specific rules', async () => {
    const command = lintCommand
    if (!command?.run) throw new Error('Command not found')
    await expect(command.run(createCommandContext({ rules: 'no-trailing-spaces,no-multiple-spaces' }))).resolves.not.toThrow()
  })

  it('should fix issues when fix flag is enabled', async () => {
    const command = lintCommand
    if (!command?.run) throw new Error('Command not found')
    const invalidTranslations = {
      welcome: 'Добро пожаловать!  ', // с пробелами в конце
      greeting: 'Привет,  мир!', // с множественными пробелами
      description: 'Это тестовый перевод', // без точки в конце
    }

    // Мокаем getI18nConfig для возврата только одной локали
    vi.mocked(getI18nConfig).mockResolvedValueOnce({
      locales: [{ code: 'ru' }],
      defaultLocale: 'ru',
      translationDir: 'locales',
    })
    vi.mocked(loadJsonFile).mockReturnValue(invalidTranslations)

    await expect(command.run(createCommandContext({ fix: true }))).resolves.not.toThrow()
    expect(fs.writeFileSync).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('Fixed'))
  })

  it('should handle missing translation directory', async () => {
    const command = lintCommand
    if (!command?.run) throw new Error('Command not found')

    // Переопределяем мок для конкретного теста
    vi.mocked(fs.existsSync).mockImplementationOnce(() => false)

    await expect(command.run(createCommandContext({
      translationDir: '/non-existent',
    }))).rejects.toThrow('Translation directory')

    expect(consola.error).toHaveBeenCalledWith(expect.stringContaining('Translation directory'))
  })

  it('should handle empty translation files', async () => {
    const command = lintCommand
    if (!command?.run) throw new Error('Command not found')

    vi.mocked(loadJsonFile).mockReturnValue({})

    await command.run(createCommandContext({}))

    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('No issues found'))
  })

  it('should report issues without fixing when fix flag is disabled', async () => {
    const command = lintCommand
    if (!command?.run) throw new Error('Command not found')
    const invalidTranslations = {
      welcome: 'Добро пожаловать!  ', // с пробелами в конце
      greeting: 'Привет,  мир!', // с множественными пробелами
      description: 'Это тестовый перевод', // без точки в конце
    }

    // Мокаем getI18nConfig для возврата только одной локали
    vi.mocked(getI18nConfig).mockResolvedValueOnce({
      locales: [{ code: 'ru' }],
      defaultLocale: 'ru',
      translationDir: 'locales',
    })
    vi.mocked(loadJsonFile).mockReturnValue(invalidTranslations)

    await expect(command.run(createCommandContext({ fix: false }))).rejects.toThrow('Found 3 issues that need to be fixed')
    expect(fs.writeFileSync).not.toHaveBeenCalled()
    expect(consola.warn).toHaveBeenCalledWith(expect.stringContaining('Found'))
  })

  it('should handle custom translation directory', async () => {
    const command = lintCommand
    if (!command?.run) throw new Error('Command not found')
    await expect(command.run(createCommandContext({ translationDir: '/custom/translations' }))).resolves.not.toThrow()
  })
})
