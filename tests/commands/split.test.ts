import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import splitCommand from '../../src/commands/split'
import { splitProjectTranslations } from '../../src/core/services/SplitService'
import { resolveProjectContext } from '../../src/commands/_shared'

vi.mock('consola', () => ({
  consola: {
    success: vi.fn(),
  },
}))

vi.mock('../../src/core/services/SplitService', () => ({
  splitProjectTranslations: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  parsePositiveIntArg: vi.fn((value: string | undefined, _name: string, fallback: number) => value ? Number.parseInt(value, 10) : fallback),
  resolveProjectContext: vi.fn(),
}))

describe('split command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveProjectContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
      project: {} as never,
    })
    vi.mocked(splitProjectTranslations).mockReturnValue([
      { locale: 'en', parts: 2 },
      { locale: 'ru', parts: 3 },
    ])
  })

  it('splits project translations and prints summary', async () => {
    if (splitCommand.run) {
      await splitCommand.run({ args: { maxKeys: '100', maxDepth: '2', splitByPrefix: false } } as never)
    }

    expect(splitProjectTranslations).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith('Split translations for locale en into 2 files')
    expect(consola.success).toHaveBeenCalledWith('Split translations for locale ru into 3 files')
  })
})
