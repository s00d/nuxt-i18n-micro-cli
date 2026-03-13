import { consola } from 'consola'
import dlv from 'dlv'
import { dset } from 'dset'
import { flatten, unflatten } from 'flat'
import fsExtra from 'fs-extra'

export function keyToNestedObject(key: string, value: unknown = ''): Record<string, unknown> {
  return unflatten({ [key]: value }, { delimiter: '.', object: true }) as Record<string, unknown>
}

export function loadJsonFile(filePath: string): Record<string, unknown> {
  if (fsExtra.pathExistsSync(filePath)) {
    const content = fsExtra.readFileSync(filePath, 'utf8')
    try {
      return JSON.parse(content)
    }
    catch (error) {
      consola.error(`Error parsing JSON file at ${filePath}:`, error)
    }
  }
  return {}
}

export function parseJsonFile(filePath: string): unknown {
  const content = fsExtra.readFileSync(filePath, 'utf8')
  return JSON.parse(content) as unknown
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fsExtra.outputJsonSync(filePath, data, { spaces: 2 })
}

export function flattenKeyValueEntries(
  translations: Record<string, unknown>,
  prefix = '',
): Array<[string, unknown]> {
  const flatEntries = flatten<Record<string, unknown>, Record<string, unknown>>(translations, {
    delimiter: '.',
    safe: true,
  })
  return Object.entries(flatEntries).map(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return [fullKey, value]
  })
}

export function flattenTranslations(translations: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of flattenKeyValueEntries(translations, prefix)) {
    if (typeof value === 'string') {
      result[key] = value
    }
  }
  return result
}

export function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
  dset(obj, key, value)
}

export function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return dlv(obj, key)
}

export function parseOptions(optionsStr: string): Record<string, unknown> {
  const options: Record<string, unknown> = {}
  const pairs = optionsStr.split(',')

  for (const pair of pairs) {
    const [key, value] = pair.split(':')
    if (key && value !== undefined) {
      const trimmedKey = key.trim()
      const trimmedValue = value.trim()
      options[trimmedKey] = parseOptionValue(trimmedValue)
    }
  }

  return options
}

function parseOptionValue(value: string): boolean | number | string {
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  if (!Number.isNaN(Number(value))) return Number(value)
  return value
}

export function saveJsonFile(filePath: string, data: unknown): void {
  writeJsonFile(filePath, data)
}
