import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runRemoteSync } from '../../src/core/services/RemoteSyncService'
import { createRemoteProvider } from '../../src/core/remote/createRemoteProvider'

vi.mock('../../src/core/remote/createRemoteProvider', () => ({
  createRemoteProvider: vi.fn(),
}))

describe('runRemoteSync provider integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses provider factory and executes pull flow', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-remote-provider-'))
    fs.writeFileSync(path.join(tempRoot, '.i18n-remote.json'), JSON.stringify({
      type: 'lokalise',
      url: 'https://api.lokalise.com/api2',
      token: 'token',
      path: 'project-id',
    }), 'utf8')

    const provider = {
      pull: vi.fn().mockResolvedValue({
        en: { greeting: 'Hello' },
      }),
      push: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(createRemoteProvider).mockReturnValue(provider as never)

    const localeSet = { global: {}, isModified: false }
    const project = {
      getLocale: vi.fn().mockReturnValue(localeSet),
      getLocaleCodes: vi.fn().mockReturnValue(['en']),
      save: vi.fn().mockResolvedValue(undefined),
    }

    await runRemoteSync({
      cwd: tempRoot,
      translationDir: tempRoot,
      localeCodes: ['en'],
      project: project as never,
      options: { pull: true, push: false, dryRun: false, force: true },
    })

    expect(createRemoteProvider).toHaveBeenCalledWith(expect.objectContaining({
      type: 'lokalise',
    }))
    expect(provider.pull).toHaveBeenCalled()
  })
})
