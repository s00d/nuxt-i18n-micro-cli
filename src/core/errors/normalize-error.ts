import axios, { type AxiosError } from 'axios'
import { CliError, isCliError } from './CliError'

function collectErrorChain(error: unknown): unknown[] {
  const chain: unknown[] = []
  let current: unknown = error

  while (current instanceof Error) {
    chain.push(current)
    current = current.cause
  }

  if (chain.length === 0 && error !== undefined) {
    chain.push(error)
  }

  return chain
}

function findAxiosError(chain: unknown[]): AxiosError | undefined {
  for (const item of chain) {
    if (axios.isAxiosError(item)) {
      return item
    }
  }
  return undefined
}

function findNodeError(chain: unknown[]): NodeJS.ErrnoException | undefined {
  for (const item of chain) {
    if (item && typeof item === 'object' && 'code' in item && typeof (item as NodeJS.ErrnoException).code === 'string') {
      return item as NodeJS.ErrnoException
    }
  }
  return undefined
}

function getAxiosMessage(error: AxiosError): string {
  const data = error.response?.data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.message === 'string') {
      return record.message
    }
    if (typeof record.error === 'string') {
      return record.error
    }
    if (record.error && typeof record.error === 'object' && typeof (record.error as Record<string, unknown>).message === 'string') {
      return String((record.error as Record<string, unknown>).message)
    }
  }
  return error.message
}

function normalizeAxiosError(error: AxiosError): CliError {
  const status = error.response?.status
  const hints = [
    'Verify network connectivity and remote API availability.',
    'Run with --debug to inspect the full HTTP response.',
  ]

  if (status === 401 || status === 403) {
    hints.unshift('Check API token, credentials, or IAM permissions.')
  }
  if (status === 429) {
    hints.unshift('Rate limit reached — reduce concurrency or add retry options.')
  }

  const details: Record<string, string> = {}
  if (status) {
    details['HTTP status'] = String(status)
  }
  if (error.config?.url) {
    details.URL = error.config.url
  }

  return new CliError({
    code: 'HTTP_ERROR',
    message: getAxiosMessage(error),
    hints,
    details,
    cause: error,
  })
}

function normalizeNodeError(error: NodeJS.ErrnoException): CliError {
  const path = error.path

  switch (error.code) {
    case 'ENOENT':
      return new CliError({
        code: 'FILE_NOT_FOUND',
        message: path ? `Path not found: ${path}` : 'File or directory not found.',
        hints: [
          'Verify the path exists and is spelled correctly.',
          'Use --cwd to point to the Nuxt project root if needed.',
        ],
        details: path ? { Path: path } : {},
        cause: error,
      })
    case 'EACCES':
    case 'EPERM':
      return new CliError({
        code: 'PERMISSION_DENIED',
        message: path ? `Permission denied: ${path}` : 'Permission denied.',
        hints: [
          'Check file permissions or run from a directory you can write to.',
        ],
        details: path ? { Path: path } : {},
        cause: error,
      })
    default:
      return new CliError({
        code: 'SYSTEM_ERROR',
        message: error.message || `System error: ${error.code}`,
        hints: ['Run with --debug for a stack trace.'],
        details: error.code ? { Code: error.code } : {},
        cause: error,
      })
  }
}

export function normalizeCliError(error: unknown): CliError {
  if (isCliError(error)) {
    return error
  }

  const chain = collectErrorChain(error)
  const axiosError = findAxiosError(chain)
  if (axiosError) {
    return normalizeAxiosError(axiosError)
  }

  const nodeError = findNodeError(chain)
  if (nodeError?.code) {
    return normalizeNodeError(nodeError)
  }

  const message = error instanceof Error ? error.message : String(error)
  return new CliError({
    code: 'COMMAND_FAILED',
    message,
    hints: ['Run with --debug for a stack trace.'],
    cause: error instanceof Error ? error : undefined,
  })
}
