import type { CommandDef } from 'citty'
import { handleCliError } from './cli-error'

/**
 * Wraps a citty command so failures are formatted by handleCliError
 * instead of citty's default `console.error(error)` dump.
 */
export function wrapCommandWithCliErrorHandler(command: CommandDef): CommandDef {
  if (!command.run) {
    return command
  }

  const run = command.run
  return {
    ...command,
    async run(context) {
      try {
        return await run(context)
      }
      catch (error: unknown) {
        handleCliError(error)
      }
    },
  }
}
