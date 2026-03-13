import { describe, expect, it } from 'vitest'
import { createRemoteProvider } from '../../src/core/remote/createRemoteProvider'
import { GithubProvider } from '../../src/core/remote/providers/GithubProvider'
import { GitlabProvider } from '../../src/core/remote/providers/GitlabProvider'
import { CustomProvider } from '../../src/core/remote/providers/CustomProvider'
import { LokaliseProvider } from '../../src/core/remote/providers/LokaliseProvider'
import { CrowdinProvider } from '../../src/core/remote/providers/CrowdinProvider'
import { TolgeeProvider } from '../../src/core/remote/providers/TolgeeProvider'
import { WeblateProvider } from '../../src/core/remote/providers/WeblateProvider'

describe('createRemoteProvider', () => {
  it('creates provider for every supported remote type', () => {
    expect(createRemoteProvider({
      type: 'github',
      url: 'https://github.com/acme/repo',
      token: 'x',
    })).toBeInstanceOf(GithubProvider)

    expect(createRemoteProvider({
      type: 'gitlab',
      url: 'https://gitlab.com/acme/repo',
      token: 'x',
    })).toBeInstanceOf(GitlabProvider)

    expect(createRemoteProvider({
      type: 'custom',
      url: 'https://example.com',
      auth: { username: 'u', password: 'p' },
    })).toBeInstanceOf(CustomProvider)

    expect(createRemoteProvider({
      type: 'lokalise',
      url: 'https://api.lokalise.com/api2',
      token: 'x',
      path: 'project-id',
    })).toBeInstanceOf(LokaliseProvider)

    expect(createRemoteProvider({
      type: 'crowdin',
      url: 'https://api.crowdin.com',
      token: 'x',
      projectId: '1',
    })).toBeInstanceOf(CrowdinProvider)

    expect(createRemoteProvider({
      type: 'tolgee',
      url: 'https://tolgee.example.com/api',
      token: 'x',
      projectId: 'project-id',
    })).toBeInstanceOf(TolgeeProvider)

    expect(createRemoteProvider({
      type: 'weblate',
      url: 'https://hosted.weblate.org/api',
      token: 'x',
      projectId: 'project-id',
    })).toBeInstanceOf(WeblateProvider)
  })
})
