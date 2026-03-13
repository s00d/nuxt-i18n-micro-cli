import { consola } from 'consola'

export function handleCliError(error: unknown, argv: string[] = process.argv): void {
  const shouldShowStack = argv.includes('--debug')
  const message = error instanceof Error ? error.message : String(error)
  consola.error(message)
  if (shouldShowStack && error instanceof Error && error.stack) {
    consola.error(error.stack)
  }
  process.exitCode = 1
}
