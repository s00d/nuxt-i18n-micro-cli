import { kebabCase } from 'scule'
import { flattenTranslations as flattenJsonTranslations } from '../utils/json'

export function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = '',
): Map<string, string> {
  return new Map(Object.entries(flattenJsonTranslations(obj, prefix)))
}

export function toSlug(text: string): string {
  const cyrillicMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }

  const transliterated = text.replace(/\p{Script=Cyrillic}/gu, (letter) => {
    const lower = letter.toLowerCase()
    return cyrillicMap[lower] ?? lower
  })

  const replacedSymbols = transliterated
    .replace(/&/g, 'and')
    .replace(/\$/g, 'dollar')
    .replace(/%/g, 'percent')
    .replace(/[\s,./\\|;:!?'"`(){}[\]<>]+/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, '')
    .trim()

  return kebabCase(replacedSymbols)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function extractKeywords(text: string): string[] {
  const cleaned = text.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.split(' ')
    .filter(word => word.length >= 2)
    .slice(0, 3)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
}

// Compatibility helpers kept for legacy tests and callers.
export function normalizeText(text: string): string {
  const endsWithInterpolation = /(?:\$\{[^}]+\}|\{\{[^}]+\}\})\s*$/.test(text)
  const withoutInterpolation = text
    .replace(/\$\{[^}]+\}/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
  const compact = withoutInterpolation.replace(/\s+/g, ' ').trim()
  if (endsWithInterpolation && compact.length > 0) {
    return `${compact} `
  }
  return compact
}

export function shouldTranslate(text: string): boolean {
  const normalized = normalizeText(text)
  if (!normalized || normalized.length < 2) {
    return false
  }
  if (/^\d+$/.test(normalized)) {
    return false
  }
  if (/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(normalized)) {
    return false
  }
  return !/\{\{.*?\}\}|\$\{.*?\}/.test(normalized)
}

export function generateTranslationKey(
  text: string,
  existingKeys: Set<string>,
  context?: string,
): string {
  const normalized = normalizeText(text)
  const slug = (toSlug(normalized) || 'translation').replace(/-/g, '_')
  const baseKey = context ? `${context}.${slug}` : slug
  let key = baseKey
  let counter = 1
  while (existingKeys.has(key)) {
    key = `${baseKey}_${counter}`
    counter++
  }
  return key
}
