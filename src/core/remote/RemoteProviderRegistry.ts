import { CrowdinProvider } from './providers/CrowdinProvider'
import { CustomProvider } from './providers/CustomProvider'
import { GithubProvider } from './providers/GithubProvider'
import { GitlabProvider } from './providers/GitlabProvider'
import { LokaliseProvider } from './providers/LokaliseProvider'
import { TolgeeProvider } from './providers/TolgeeProvider'
import { WeblateProvider } from './providers/WeblateProvider'
import type { RemoteProviderConstructor } from './RemoteProvider'

const remoteProviderRegistry: Record<string, RemoteProviderConstructor> = {
  github: GithubProvider,
  gitlab: GitlabProvider,
  custom: CustomProvider,
  lokalise: LokaliseProvider,
  crowdin: CrowdinProvider,
  tolgee: TolgeeProvider,
  weblate: WeblateProvider,
}

export default remoteProviderRegistry
