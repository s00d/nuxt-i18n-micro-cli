import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LokaliseProvider } from '../../src/core/remote/providers/LokaliseProvider'

const state = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  parseZip: vi.fn(),
  projectGet: vi.fn(),
  asyncDownload: vi.fn(),
  queuedGet: vi.fn(),
  upload: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: state.axiosGet,
  },
}))

vi.mock('../../src/core/remote/utils/bundle', () => ({
  parseTranslationsFromZip: state.parseZip,
}))

vi.mock('@lokalise/node-api', () => ({
  LokaliseApi: class {
    projects() {
      return {
        get: state.projectGet,
      }
    }

    files() {
      return {
        async_download: state.asyncDownload,
        upload: state.upload,
      }
    }

    queuedProcesses() {
      return {
        get: state.queuedGet,
      }
    }
  },
}))

describe('LokaliseProvider smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.projectGet.mockResolvedValue({ project_id: 'project-id' })
    state.asyncDownload.mockResolvedValue({ process_id: 'p1' })
    state.queuedGet.mockResolvedValue({
      status: 'finished',
      details: { download_url: 'https://example.com/lok.zip' },
    })
    state.axiosGet.mockResolvedValue({ data: new Uint8Array([1, 2, 3]).buffer })
    state.parseZip.mockResolvedValue({ en: { home: { title: 'Hello' } } })
    state.upload.mockResolvedValue({ process_id: 'up1' })
  })

  it('pulls and pushes locale payload via native Lokalise processes', async () => {
    const provider = new LokaliseProvider({
      type: 'lokalise',
      url: 'https://api.lokalise.com/api2',
      token: 'token',
      path: 'project-id',
    })

    const pulled = await provider.pull()
    await provider.push(pulled)

    expect(pulled.en?.home).toBeDefined()
    expect(state.asyncDownload).toHaveBeenCalledWith('project-id', expect.any(Object))
    expect(state.upload).toHaveBeenCalledWith('project-id', expect.objectContaining({
      filename: 'en.json',
      lang_iso: 'en',
    }))
    expect(state.projectGet).toHaveBeenCalledWith('project-id')
  })
})
