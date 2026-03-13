import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import textToI18nCommand from '../../src/commands/text-to-i18n'
import { runTextToI18n } from '../../src/core/services/TextToI18nService'
import { input, select } from '@inquirer/prompts'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/TextToI18nService', () => ({
  runTextToI18n: vi.fn(),
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
}))

describe('text-to-i18n command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(runTextToI18n).mockReturnValue({
      files: ['a.vue'],
      newTranslations: new Map([['welcome', { value: 'Welcome', file: 'a.vue', line: 1 }]]),
    } as never)
  })

  it('runs service and reports updates', async () => {
    if (textToI18nCommand.run) {
      await textToI18nCommand.run({ args: { cwd: '/test/project', translationFile: 'locales/en.json', dryRun: false, verbose: false } } as never)
    }
    expect(runTextToI18n).toHaveBeenCalledWith(expect.objectContaining({
      extractOnlyDirectories: ['plugins'],
    }))
    expect(consola.success).toHaveBeenCalledWith('Updated translation file.')
  })

  it('prints dry-run details when dryRun is true', async () => {
    if (textToI18nCommand.run) {
      await textToI18nCommand.run({ args: { cwd: '/test/project', translationFile: 'locales/en.json', dryRun: true, verbose: false } } as never)
    }
    expect(consola.info).toHaveBeenCalledWith('Dry run - no files were modified.')
  })

  it('passes custom extract-only directories to service', async () => {
    if (textToI18nCommand.run) {
      await textToI18nCommand.run({
        args: {
          cwd: '/test/project',
          translationFile: 'locales/en.json',
          dryRun: true,
          verbose: false,
          extractOnlyDirs: 'plugins,hooks,custom',
        },
      } as never)
    }

    expect(runTextToI18n).toHaveBeenCalledWith(expect.objectContaining({
      extractOnlyDirectories: ['plugins', 'hooks', 'custom'],
    }))
  })

  it('passes custom extract-only patterns to service', async () => {
    if (textToI18nCommand.run) {
      await textToI18nCommand.run({
        args: {
          cwd: '/test/project',
          translationFile: 'locales/en.json',
          dryRun: true,
          verbose: false,
          extractOnlyPatterns: '**/*.plugin.ts,**/schemas/**/*.ts',
        },
      } as never)
    }

    expect(runTextToI18n).toHaveBeenCalledWith(expect.objectContaining({
      extractOnlyPatterns: ['**/*.plugin.ts', '**/schemas/**/*.ts'],
    }))
  })

  it('runs interactive flow and applies edited/skip decisions', async () => {
    vi.mocked(runTextToI18n)
      .mockReturnValueOnce({
        files: ['a.vue'],
        newTranslations: new Map([
          ['components.a.welcome', { value: 'Welcome', file: 'a.vue', line: 1 }],
          ['components.a.subtitle', { value: 'Subtitle', file: 'a.vue', line: 2 }],
        ]),
      } as never)
      .mockReturnValueOnce({
        files: ['a.vue'],
        newTranslations: new Map([['home.welcome', { value: 'Welcome', file: 'a.vue', line: 1 }]]),
      } as never)
    vi.mocked(select)
      .mockResolvedValueOnce('edit' as never)
      .mockResolvedValueOnce('skip' as never)
    vi.mocked(input).mockResolvedValue('home.welcome' as never)

    if (textToI18nCommand.run) {
      await textToI18nCommand.run({
        args: {
          cwd: '/test/project',
          translationFile: 'locales/en.json',
          dryRun: false,
          verbose: false,
          interactive: true,
        },
      } as never)
    }

    expect(runTextToI18n).toHaveBeenCalledTimes(2)
    expect(runTextToI18n).toHaveBeenNthCalledWith(1, expect.objectContaining({
      dryRun: true,
      keyOverrides: {},
      skippedKeys: [],
    }))
    expect(runTextToI18n).toHaveBeenNthCalledWith(2, expect.objectContaining({
      dryRun: false,
      keyOverrides: { 'components.a.welcome': 'home.welcome' },
      skippedKeys: ['components.a.subtitle'],
    }))
  })
})
