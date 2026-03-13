import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TolgeeProvider } from '../../src/core/remote/providers/TolgeeProvider'
import { WeblateProvider } from '../../src/core/remote/providers/WeblateProvider'

const state = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  create: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: state.create,
  },
}))

describe('Tolgee/Weblate providers smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.create.mockReturnValue({
      get: state.get,
      put: state.put,
      defaults: { headers: { common: {} } },
    })
  })

  it('Tolgee provider uses project translation endpoint', async () => {
    state.get.mockResolvedValue({ data: { en: { title: 'Hello' } } })
    state.put.mockResolvedValue({})

    const provider = new TolgeeProvider({
      type: 'tolgee',
      url: 'https://tolgee.example.com/api',
      token: 'token',
      projectId: 'p1',
    })
    const pulled = await provider.pull()
    await provider.push(pulled)

    expect(state.get).toHaveBeenCalledWith('/projects/p1/translations')
    expect(state.put).toHaveBeenCalledWith('/projects/p1/translations', pulled)
  })

  it('Weblate provider uses project translation endpoint', async () => {
    state.get.mockResolvedValue({ data: { en: { title: 'Hello' } } })
    state.put.mockResolvedValue({})

    const provider = new WeblateProvider({
      type: 'weblate',
      url: 'https://hosted.weblate.org/api',
      token: 'token',
      projectId: 'p2',
    })
    const pulled = await provider.pull()
    await provider.push(pulled)

    expect(state.get).toHaveBeenCalledWith('/projects/p2/translations')
    expect(state.put).toHaveBeenCalledWith('/projects/p2/translations', pulled)
  })
})
