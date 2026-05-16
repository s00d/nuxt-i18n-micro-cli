import { getTranslatorErrorMessage } from '../error'
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

export function createDriverError(provider: string, error: unknown): Error {
  return new Error(`${provider} API error: ${getTranslatorErrorMessage(error)}`)
}

export function createDriverTypeError(provider: string, message: string): TypeError {
  return new TypeError(`${provider} API error: ${message}`)
}
