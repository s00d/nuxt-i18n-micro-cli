import { runMain } from 'citty'
import { main } from './main'
import { handleCliError } from './core/utils/cli-error'

runMain(main).catch((error: unknown) => {
  handleCliError(error)
})
