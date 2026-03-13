import { runMain as _runMain } from 'citty'
import { main } from './main'
import { handleCliError } from './core/utils/cli-error'

export const runMain = async () => {
  try {
    await _runMain(main)
  }
  catch (error: unknown) {
    handleCliError(error)
  }
}
