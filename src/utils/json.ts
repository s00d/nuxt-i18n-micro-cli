import fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import { ensureDirectoryExists } from './dir'

// Функция для преобразования ключа в объект
export function keyToNestedObject(key: string, value: unknown = ''): Record<string, unknown> {
  const parts = key.split('.')
  return parts.reduceRight<Record<string, unknown>>((acc, part) => {
    return typeof acc === 'string' ? { [part]: acc } : { [part]: acc }
  }, value as Record<string, unknown>)
}

// Функция для загрузки JSON файлов
export function loadJsonFile(filePath: string): Record<string, unknown> {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    try {
      return JSON.parse(content)
    }
    catch (error) {
      consola.error(`Error parsing JSON file at ${filePath}:`, error)
    }
  }
  return {}
}

export function writeJsonFile(filePath: string, data: Record<string, unknown>): void {
  ensureDirectoryExists(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

// Функция для преобразования ключей в вложенные объекты
export function convertToNestedObjects(keys: Set<string>): Record<string, unknown> {
  const nestedObject: Record<string, unknown> = {}
  keys.forEach((key) => {
    const nested = keyToNestedObject(key)
    Object.assign(nestedObject, nested)
  })
  return nestedObject
}

export function flattenTranslations(translations: Record<string, unknown>, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {}
  for (const key in translations) {
    const value = translations[key]
    const newPrefix = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      result[newPrefix] = value
    }
    else if (typeof value === 'object' && value !== null) {
      result = { ...result, ...flattenTranslations(value as Record<string, unknown>, newPrefix) }
    }
  }
  return result
}

export function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
  const keys = key.split('.')
  let current = obj
  keys.forEach((k, index) => {
    if (index === keys.length - 1) {
      current[k] = value
    }
    else {
      current[k] = current[k] || {}
      current = current[k] as Record<string, unknown>
    }
  })
}

export function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const keys = key.split('.')
  let result: unknown = obj
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k]
    }
    else {
      return undefined
    }
  }
  return result
}

export function parseOptions(optionsStr: string): { [key: string]: any } {
  const options: { [key: string]: any } = {}
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

function parseOptionValue(value: string): any {
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  if (!Number.isNaN(Number(value))) return Number(value)
  return value
}

export function getAllJsonPaths(dir: string, locale: string): string[] {
  const paths: string[] = []
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        paths.push(...getAllJsonPaths(fullPath, locale))
      }
      else if (entry.isFile() && path.extname(entry.name) === '.json' && entry.name.includes(locale)) {
        paths.push(fullPath)
      }
    })
  }
  return paths
}
