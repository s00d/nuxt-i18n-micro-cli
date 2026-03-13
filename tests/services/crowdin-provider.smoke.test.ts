import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CrowdinProvider } from '../../src/core/remote/providers/CrowdinProvider'

const state = vi.hoisted(() => ({
  buildProject: vi.fn(),
  checkBuildStatus: vi.fn(),
  downloadTranslations: vi.fn(),
  addStorage: vi.fn(),
  importTranslations: vi.fn(),
  importTranslationsStatus: vi.fn(),
  axiosGet: vi.fn(),
  parseZip: vi.fn(),
  createZip: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: state.axiosGet,
  },
}))

vi.mock('../../src/core/remote/utils/bundle', () => ({
  parseTranslationsFromZip: state.parseZip,
  createZipFromTranslations: state.createZip,
}))

vi.mock('@crowdin/crowdin-api-client', () => ({
  Client: class {
    translationsApi = {
      buildProject: state.buildProject,
      checkBuildStatus: state.checkBuildStatus,
      downloadTranslations: state.downloadTranslations,
      importTranslations: state.importTranslations,
      importTranslationsStatus: state.importTranslationsStatus,
    }

    uploadStorageApi = {
      addStorage: state.addStorage,
    }
  },
}))

describe('CrowdinProvider smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.buildProject.mockResolvedValue({ data: { id: 10 } })
    state.checkBuildStatus.mockResolvedValue({ data: { status: 'finished' } })
    state.downloadTranslations.mockResolvedValue({ data: { url: 'https://example.com/bundle.zip' } })
    state.axiosGet.mockResolvedValue({ data: new Uint8Array([1, 2, 3]).buffer })
    state.parseZip.mockResolvedValue({ en: { greeting: 'Hello' } })
    state.createZip.mockResolvedValue(Buffer.from([1, 2, 3]))
    state.addStorage.mockResolvedValue({ data: { id: 20 } })
    state.importTranslations.mockResolvedValue({ data: { identifier: 'import-1' } })
    state.importTranslationsStatus.mockResolvedValue({ data: { status: 'finished' } })
  })

  it('pulls and pushes locale payload with build/import flows', async () => {
    const provider = new CrowdinProvider({
      type: 'crowdin',
      url: 'https://api.crowdin.com',
      token: 'token',
      projectId: '1',
    })

    const pulled = await provider.pull()
    await provider.push(pulled)

    expect(state.buildProject).toHaveBeenCalledWith(1, expect.any(Object))
    expect(state.downloadTranslations).toHaveBeenCalledWith(1, 10)
    expect(state.importTranslations).toHaveBeenCalledWith(1, expect.objectContaining({
      storageId: 20,
      languageIds: ['en'],
    }))
  })
})
