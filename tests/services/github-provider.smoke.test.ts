import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GithubProvider } from '../../src/core/remote/providers/GithubProvider'

const state = vi.hoisted(() => ({
  getContent: vi.fn(),
  createOrUpdateFileContents: vi.fn(),
}))

vi.mock('octokit', () => ({
  Octokit: class {
    rest = {
      repos: {
        getContent: state.getContent,
        createOrUpdateFileContents: state.createOrUpdateFileContents,
      },
    }
  },
}))

describe('GithubProvider smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pulls and pushes locale files using Octokit', async () => {
    state.getContent
      .mockResolvedValueOnce({
        data: [
          { type: 'file', name: 'en.json', path: 'translations/en.json' },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          type: 'file',
          sha: 'sha1',
          content: Buffer.from(JSON.stringify({ home: { title: 'Hello' } })).toString('base64'),
        },
      })
      .mockResolvedValueOnce({
        data: {
          type: 'file',
          sha: 'sha1',
          content: Buffer.from(JSON.stringify({ home: { title: 'Hello' } })).toString('base64'),
        },
      })
    state.createOrUpdateFileContents.mockResolvedValue({})

    const provider = new GithubProvider({
      type: 'github',
      url: 'https://github.com/acme/repo',
      token: 'token',
      path: 'translations',
    })

    const pulled = await provider.pull()
    await provider.push(pulled)

    expect(pulled.en?.home).toBeDefined()
    expect(state.createOrUpdateFileContents).toHaveBeenCalledWith(expect.objectContaining({
      owner: 'acme',
      repo: 'repo',
      path: 'translations/en.json',
    }))
  })
})
