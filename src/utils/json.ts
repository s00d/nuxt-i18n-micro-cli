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
