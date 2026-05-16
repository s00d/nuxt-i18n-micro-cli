import { getTranslatorErrorMessage } from '../translate/error'
import { CliError } from './CliError'

export function cliValidationError(
  message: string,
  hints: readonly string[] = [],
  details?: Record<string, string>,
): CliError {
  return new CliError({
    code: 'VALIDATION_ERROR',
    message,
    hints: hints.length > 0
      ? hints
      : ['Check command arguments and run i18n-micro <command> --help for usage.'],
    details,
  })
}

export function cliUsageError(
  message: string,
  hints: readonly string[] = [],
  details?: Record<string, string>,
): CliError {
  return new CliError({
    code: 'USAGE_ERROR',
    message,
    hints,
    details,
  })
}

export function cliNotFoundError(
  message: string,
  hints: readonly string[] = [],
  details?: Record<string, string>,
): CliError {
  return new CliError({
    code: 'NOT_FOUND',
    message,
    hints: hints.length > 0
      ? hints
      : ['Verify paths exist and use --cwd if the project is in another directory.'],
    details,
  })
}

export function cliCommandFailedError(
  message: string,
  hints: readonly string[] = [],
  details?: Record<string, string>,
): CliError {
  return new CliError({
    code: 'COMMAND_FAILED',
    message,
    hints,
    details,
  })
}

export function cliTranslatorError(provider: string, error: unknown): CliError {
  return new CliError({
    code: 'TRANSLATOR_API_ERROR',
    message: `${provider} API error: ${getTranslatorErrorMessage(error)}`,
    details: { Provider: provider },
    hints: [
      'Verify API token/credentials and provider service status.',
      'For rate limits, retry with --options retries:3,retryMinTimeoutMs:1000',
    ],
    cause: error,
  })
}

export function cliRemoteConfigError(
  message: string,
  hints: readonly string[] = [],
  details?: Record<string, string>,
): CliError {
  return new CliError({
    code: 'REMOTE_CONFIG_ERROR',
    message,
    hints,
    details,
  })
}
