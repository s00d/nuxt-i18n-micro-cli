import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import optimizeCommand from '../../src/commands/optimize'
import { printJson, resolveCommandContext, parsePositiveIntArg } from '../../src/commands/_shared'
import { runOptimization } from '../../src/core/services/OptimizeService'

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn(() => true) },
}))

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    prompt: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  ensureTranslationDirExists: vi.fn(),
  resolveCommandContext: vi.fn(),
  parsePositiveIntArg: vi.fn((value: string | undefined, _name: string, fallback: number) => value ? Number.parseInt(value, 10) : fallback),
  printJson: vi.fn(),
}))

vi.mock('../../src/core/services/OptimizeService', () => ({
  formatSize: vi.fn((v: number) => `${v} B`),
  analyzeFiles: vi.fn(),
  updateTranslationPaths: vi.fn(),
  runOptimization: vi.fn(),
}))

describe('optimize command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveCommandContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {} as never,
    })
    vi.mocked(runOptimization).mockResolvedValue({
      analysis: {
        totalFiles: 1,
        totalSize: 1000,
        averageSize: 1000,
        largeFiles: [],
        deepNestingFiles: [],
        duplicateKeysFiles: [],
      },
    } as never)
  })

  it('runs dry analysis and reports no optimizations needed', async () => {
    if (optimizeCommand.run) {
      await optimizeCommand.run({ args: { dryRun: false, minSize: '100', maxDepth: '2' } } as never)
    }
    expect(parsePositiveIntArg).toHaveBeenCalled()
    expect(runOptimization).toHaveBeenCalled()
    expect(consola.success).toHaveBeenCalledWith(expect.stringContaining('No optimizations needed'))
  })

  it('prints json analysis when json flag is enabled', async () => {
    if (optimizeCommand.run) {
      await optimizeCommand.run({ args: { json: true, minSize: '100', maxDepth: '2' } } as never)
    }
    expect(printJson).toHaveBeenCalled()
  })
})
