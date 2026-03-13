import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import lintCommand from '../../src/commands/lint'
import {
  collectLintResults,
  applyLintFixes,
  buildCustomRegexRules,
  lintRules,
  loadLintConfig,
} from '../../src/core/services/LintService'
import { printJson, resolveCommandContext } from '../../src/commands/_shared'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}))

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/LintService', () => ({
  lintRules: [{ name: 'missing-keys' }, { name: 'empty-values' }],
  collectLintResults: vi.fn(),
  applyLintFixes: vi.fn(),
  loadLintConfig: vi.fn(() => ({})),
  buildCustomRegexRules: vi.fn(() => []),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  ensureTranslationDirExists: vi.fn(),
  resolveCommandContext: vi.fn(),
  printJson: vi.fn(),
}))

describe('lint command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveCommandContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: { locales: [{ code: 'en' }] },
    } as never)
    vi.mocked(loadLintConfig).mockReturnValue({})
    vi.mocked(buildCustomRegexRules).mockReturnValue([])
  })

  it('throws when issues exist without fix flag', async () => {
    vi.mocked(collectLintResults).mockReturnValue([{ rule: 'missing-keys', message: 'issue' }] as never)
    if (lintCommand.run) {
      await expect(lintCommand.run({ args: { fix: false, rules: lintRules.map(r => r.name).join(',') } } as never))
        .rejects.toThrow('Found 1 issues that need to be fixed')
    }
  })

  it('applies fixes when fix is enabled', async () => {
    vi.mocked(collectLintResults).mockReturnValue([{ rule: 'missing-keys', message: 'issue' }] as never)
    vi.mocked(applyLintFixes).mockReturnValue({ fixedCount: 1 } as never)
    if (lintCommand.run) {
      await expect(lintCommand.run({ args: { fix: true, rules: 'missing-keys' } } as never)).resolves.toBeUndefined()
    }
    expect(applyLintFixes).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('Fixed 1 issues automatically'))
  })

  it('prints json summary when json flag is enabled', async () => {
    vi.mocked(collectLintResults).mockReturnValue([{ rule: 'missing-keys', message: 'issue' }] as never)
    if (lintCommand.run) {
      await expect(lintCommand.run({ args: { json: true, fix: false, rules: 'missing-keys' } } as never))
        .rejects.toThrow('Found 1 issues that need to be fixed')
    }
    expect(printJson).toHaveBeenCalled()
  })

  it('uses enabled rules from .i18n-lintrc.json when cli rules are not provided', async () => {
    vi.mocked(loadLintConfig).mockReturnValue({
      enabledRules: ['empty-values'],
    })
    vi.mocked(collectLintResults).mockReturnValue([] as never)

    if (lintCommand.run) {
      await expect(lintCommand.run({ args: { fix: false } } as never)).resolves.toBeUndefined()
    }

    expect(collectLintResults).toHaveBeenCalledWith(expect.objectContaining({
      rulesToCheck: [{ name: 'empty-values' }],
    }))
  })
})
