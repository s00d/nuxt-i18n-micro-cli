import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import extractCommand from '../../src/commands/extract'
import { ensureDirectoryExists } from '../../src/core/utils/dir'
import { extractTranslations } from '../../src/core/utils/components'
import { applyExtractedKeys } from '../../src/core/services/ExtractService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    log: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('../../src/core/utils/dir', () => ({
  ensureDirectoryExists: vi.fn(),
}))

vi.mock('../../src/core/utils/components', () => ({
  extractTranslations: vi.fn(),
}))

vi.mock('../../src/core/services/ExtractService', () => ({
  applyExtractedKeys: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveProjectContext: vi.fn(),
}))

describe('extract command', () => {
  const project = { save: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: project as never,
    })
    vi.mocked(extractTranslations).mockReturnValue({
      global: new Set(['hello']),
      pageSpecific: { home: new Set(['title']) },
      warnings: [],
    })
  })

  it('extracts keys and saves project', async () => {
    if (extractCommand.run) {
      await extractCommand.run({ args: { cwd: '/test/project', translationDir: 'locales' } } as never)
    }

    expect(ensureDirectoryExists).toHaveBeenCalledWith('locales')
    expect(extractTranslations).toHaveBeenCalledWith('/test/project')
    expect(applyExtractedKeys).toHaveBeenCalled()
    expect(project.save).toHaveBeenCalled()
    expect(consola.log).toHaveBeenCalledWith('Locale-specific translations have been saved to JSON files.')
  })

  it('prints warnings for dynamic translation keys', async () => {
    vi.mocked(extractTranslations).mockReturnValue({
      global: new Set<string>(),
      pageSpecific: {},
      warnings: [{ file: '/test/project/pages/home.vue', expression: '$t(\'errors.\' + code)' }],
    })

    if (extractCommand.run) {
      await extractCommand.run({ args: { cwd: '/test/project', translationDir: 'locales' } } as never)
    }

    expect(consola.warn).toHaveBeenCalledWith(expect.stringContaining('Dynamic i18n key detected'))
  })
})
