export class CliError extends Error {
  readonly code: string
  readonly hints: readonly string[]
  readonly details: Readonly<Record<string, string>>

  constructor(options: {
    code: string
    message: string
    hints?: readonly string[]
    details?: Record<string, string>
    cause?: unknown
  }) {
    super(options.message)
    this.name = 'CliError'
    this.code = options.code
    this.hints = options.hints ?? []
    this.details = options.details ?? {}
    if (options.cause instanceof Error) {
      this.cause = options.cause
    }
  }
}

export function isCliError(error: unknown): error is CliError {
  return error instanceof CliError
}
