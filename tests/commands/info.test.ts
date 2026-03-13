import { beforeEach, describe, expect, it, vi } from 'vitest'
import infoCommand from '../../src/commands/info'
import { buildInfoSnapshot } from '../../src/core/services/InfoService'
import { resolveCommandContext, printInfoRows, printJson } from '../../src/commands/_shared'
import { renderSection } from '../../src/commands/_render'

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
  },
}))

vi.mock('../../src/core/services/InfoService', () => ({
  buildInfoSnapshot: vi.fn(),
}))

vi.mock('../../src/commands/_shared', () => ({
  sharedArgs: {},
  printDependencyGroup: vi.fn(),
  resolveCommandContext: vi.fn(),
  printInfoRows: vi.fn(),
  printJson: vi.fn(),
}))

vi.mock('../../src/commands/_render', () => ({
  renderSection: vi.fn(),
  renderList: vi.fn(),
}))

describe('info command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveCommandContext).mockResolvedValue({
      cwd: '/test/project',
      translationDir: 'locales',
      config: {
        locales: [{ code: 'en' }],
        defaultLocale: 'en',
        translationDir: 'locales',
      },
    })
    vi.mocked(buildInfoSnapshot).mockReturnValue({
      cli: { name: 'cli', version: '1.0.0', description: '', repository: '', license: '', dependencies: {}, devDependencies: {}, engines: {}, packageManager: '' },
      project: {
        cwd: '/test/project',
        package: null,
        translationDir: 'locales',
        defaultLocale: 'en',
        totalLocales: 1,
        locales: [{ code: 'en' }],
        translationStats: {
          totalFiles: 1,
          totalSize: '1 KB',
          largestFile: { name: 'en.json', size: '1 KB' },
          lastModified: 'now',
          filesByLocale: { en: { count: 1, size: '1 KB' } },
        },
      },
      system: {
        nodeVersion: 'v22',
        platform: 'darwin',
        arch: 'arm64',
        cpus: 8,
        memory: { used: '1 GB', total: '2 GB', usagePercent: 50 },
        uptime: 1,
        hostname: 'host',
        user: 'user',
        shell: '/bin/zsh',
        env: { NODE_ENV: 'test' },
      },
      debug: {
        process: { pid: 1, ppid: 0, execPath: '/usr/bin/node' },
        os: { type: 'Darwin', release: '24.0', version: '24.0', homedir: '/Users/test', tmpdir: '/tmp', loadavg: [0, 0, 0] },
      },
    } as never)
  })

  it('prints json when json flag is enabled', async () => {
    if (infoCommand.run) {
      await infoCommand.run({ args: { json: true, debug: false } } as never)
    }
    expect(printJson).toHaveBeenCalled()
  })

  it('prints sections in text mode', async () => {
    if (infoCommand.run) {
      await infoCommand.run({ args: { json: false, debug: false } } as never)
    }
    expect(renderSection).toHaveBeenCalledWith('CLI Information')
    expect(renderSection).toHaveBeenCalledWith('Project Configuration')
    expect(renderSection).toHaveBeenCalledWith('System Information')
    expect(printInfoRows).toHaveBeenCalled()
  })
})
