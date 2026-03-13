import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GitlabProvider } from '../../src/core/remote/providers/GitlabProvider'

const state = vi.hoisted(() => ({
  allRepositoryTrees: vi.fn(),
  show: vi.fn(),
  create: vi.fn(),
  edit: vi.fn(),
}))

vi.mock('@gitbeaker/rest', () => ({
  Gitlab: class {
    Repositories = {
      allRepositoryTrees: state.allRepositoryTrees,
    }

    RepositoryFiles = {
      show: state.show,
      create: state.create,
      edit: state.edit,
    }
  },
}))

describe('GitlabProvider smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pulls and pushes locale files using Gitbeaker', async () => {
    state.allRepositoryTrees.mockResolvedValue([
      { type: 'blob', path: 'translations/en.json' },
    ])
    state.show
      .mockResolvedValueOnce({
        content: Buffer.from(JSON.stringify({ home: { title: 'Hello' } })).toString('base64'),
      })
      .mockResolvedValueOnce({
        content: Buffer.from(JSON.stringify({ home: { title: 'Hello' } })).toString('base64'),
      })
    state.edit.mockResolvedValue({})

    const provider = new GitlabProvider({
      type: 'gitlab',
      url: 'https://gitlab.com/acme/repo',
      token: 'token',
      path: 'translations',
    })

    const pulled = await provider.pull()
    await provider.push(pulled)

    expect(pulled.en?.home).toBeDefined()
    expect(state.edit).toHaveBeenCalledWith(
      'acme/repo',
      'translations/en.json',
      'main',
      expect.any(String),
      expect.stringContaining('Update en.json'),
    )
  })
})
