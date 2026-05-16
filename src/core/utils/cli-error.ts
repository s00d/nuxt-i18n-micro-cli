import { consola } from 'consola'
import { normalizeCliError } from '../errors'
import {
  formatErrorDetail,
  formatErrorHeadline,
  formatErrorHint,
  formatErrorStack,
  supportsTerminalColors,
} from './terminal-colors'

export function formatCliErrorLines(error: ReturnType<typeof normalizeCliError>): string[] {
  const lines: string[] = [error.message]

  for (const [label, value] of Object.entries(error.details)) {
    lines.push(formatErrorDetail(label, value))
  }

  for (const hint of error.hints) {
    lines.push(formatErrorHint(hint))
  }

  return lines
}

export function handleCliError(error: unknown, argv: string[] = process.argv): void {
  const shouldShowStack = argv.includes('--debug')
  const normalized = normalizeCliError(error)
  const useColors = supportsTerminalColors()

  consola.error(
    useColors
      ? formatErrorHeadline(normalized.code, normalized.message)
      : normalized.message,
  )

  for (const [label, value] of Object.entries(normalized.details)) {
    const line = formatErrorDetail(label, value)
    if (useColors) {
      consola.log(`  ${line}`)
    }
    else {
      consola.info(line)
    }
  }

  for (const hint of normalized.hints) {
    const line = formatErrorHint(hint)
    if (useColors) {
      consola.log(`  ${line}`)
    }
    else {
      consola.info(line)
    }
  }

  if (shouldShowStack) {
    if (normalized.stack) {
      consola.error(formatErrorStack(normalized.stack))
      process.exitCode = 1
      return
    }
    if (normalized.cause instanceof Error && normalized.cause.stack) {
      consola.error(formatErrorStack(normalized.cause.stack))
    }
  }

  process.exitCode = 1
}
