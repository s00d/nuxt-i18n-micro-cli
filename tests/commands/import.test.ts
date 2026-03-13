import { beforeEach, describe, expect, it, vi } from 'vitest'
import importCommand from '../../src/commands/import'
import { ensureDirectoryExists } from '../../src/core/utils/dir'
import { convertPoToJson } from '../../src/core/utils/po'
import { resolveCommandContext } from '../../src/commands/_shared'

vi.mock('../../src/core/utils/po', () => ({
  convertPoToJson: vi.fn(),
}))

vi.mock('../../src/core/utils/dir', () => ({
  ensureDirectoryExists: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  resolveCommandContext: vi.fn(),
}))

describe('import command', () => {
  const mockTranslationDir = '/path/to/translations'
  const mockPotsDir = '/path/to/pots'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveCommandContext).mockResolvedValue({
      cwd: '/test',
      translationDir: mockTranslationDir,
      config: {} as never,
    })
  })

  const createCommandContext = ({
    cwd = '/test',
    translationDir = mockTranslationDir,
    potsDir = mockPotsDir,
    logLevel = 'info',
  } = {}) => {
    return {
      args: { cwd, translationDir, potsDir, logLevel },
    }
  }

  it('should convert PO files to JSON', async () => {
    if (importCommand.run) await importCommand.run(createCommandContext({}) as never)

    expect(ensureDirectoryExists).toHaveBeenCalledWith(mockTranslationDir)
    expect(convertPoToJson).toHaveBeenCalledWith(mockPotsDir, mockTranslationDir)
  })

  it('should handle missing translation directory', async () => {
    vi.mocked(resolveCommandContext).mockResolvedValueOnce({
      cwd: '/test',
      translationDir: '/non-existent',
      config: {} as never,
    })
    vi.mocked(ensureDirectoryExists).mockImplementationOnce(() => {
      throw new Error('Translation directory does not exist')
    })

    if (importCommand.run) {
      await expect(importCommand.run(createCommandContext({ translationDir: '/non-existent' }) as never))
        .rejects.toThrow('Translation directory does not exist')
    }
  })

  it('should handle invalid PO files', async () => {
    vi.mocked(convertPoToJson).mockImplementationOnce(() => {
      throw new Error('Invalid PO file')
    })
    if (importCommand.run) {
      await expect(importCommand.run(createCommandContext({}) as never)).rejects.toThrow('Invalid PO file')
    }
  })

  it('should create translation directory if it does not exist', async () => {
    if (importCommand.run) await importCommand.run(createCommandContext({}) as never)
    expect(ensureDirectoryExists).toHaveBeenCalledWith(mockTranslationDir)
  })
})
