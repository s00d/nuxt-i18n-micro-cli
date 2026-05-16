import { runCommand } from 'citty'
import { main } from './main'
import { cliVersion } from './package-meta'
import { CliError } from './core/errors'
import { handleCliError } from './core/utils/cli-error'

function isCittyCliError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'CLIError'
}

export async function runMain(): Promise<void> {
  const rawArgs = process.argv.slice(2)

  try {
    if (shouldShowHelp(rawArgs)) {
      const { showUsage } = await import('citty')
      await showUsage(main)
      return
    }

    if (shouldShowVersion(rawArgs)) {
      console.log(cliVersion)
      return
    }

    await runCommand(main, { rawArgs })
  }
  catch (error: unknown) {
    if (isCittyCliError(error)) {
      handleCliError(new CliError({
        code: 'USAGE_ERROR',
        message: error.message,
        hints: ['Run i18n-micro --help to see available commands.'],
      }))
    }
    else {
      handleCliError(error)
    }
  }

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode)
  }
}

function shouldShowHelp(rawArgs: string[]): boolean {
  return rawArgs.includes('--help') || rawArgs.includes('-h')
}

function shouldShowVersion(rawArgs: string[]): boolean {
  return rawArgs.length === 1 && (rawArgs[0] === '--version' || rawArgs[0] === '-v')
}
