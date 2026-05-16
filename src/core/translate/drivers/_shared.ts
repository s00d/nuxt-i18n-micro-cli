import { cliTranslatorError } from '../../errors'
import type { TranslateOptions } from './TranslatorDriver'

export function getNumericOption(
  options: TranslateOptions | undefined,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = Number(options?.[key])
    if (Number.isFinite(value)) {
      return value
    }
  }
  return undefined
}

export function getStringOption(
  options: TranslateOptions | undefined,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = options?.[key]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }
  return undefined
}

export function createDriverError(provider: string, error: unknown) {
  return cliTranslatorError(provider, error)
}

export function createDriverTypeError(provider: string, message: string) {
  return cliTranslatorError(provider, new Error(message))
}
