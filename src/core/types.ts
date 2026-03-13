export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject {
  [key: string]: JsonValue
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isJsonObject(value) ? value : {}
}

export interface TranslationSetData {
  global: JsonObject
  pages: Record<string, JsonObject>
}

export interface ProjectConfig {
  cwd: string
  translationDir: string
  translationDirs: string[]
  defaultLocale: string
  locales: Array<{ code: string }>
}

export interface ProjectLoadOptions {
  logLevel?: string
  translationDir?: string
}
