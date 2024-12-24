import slugify from 'slugify'

export function normalizeText(text: string): string {
  return text
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove common dynamic interpolations
    .replace(/\$\{[^}]+\}/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\{[^}]+\}/g, '')
}

export function shouldTranslate(text: string): boolean {
  // Skip if text is too short
  if (text.length < 2) return false

  // Skip if text is just numbers
  if (/^\d+$/.test(text)) return false

  // Skip if text looks like a variable name
  if (/^[a-z][a-z0-9]*$/i.test(text)) return false

  // Skip common development texts
  const skipPatterns = [
    /^(?:true|false|null|undefined|NaN)$/,
    /^[/\\][\w.\-/\\]+$/, // File paths
    /^https?:\/\//i, // URLs
    /^[a-f0-9]{32}$/i, // MD5 hashes
    /^[a-f0-9-]{36}$/i, // UUIDs
  ]

  return !skipPatterns.some(pattern => pattern.test(text))
}

export function generateTranslationKey(
  text: string,
  existingKeys: Set<string>,
  context?: string,
): string {
  const base = normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40)

  let key = context ? `${context}.${base}` : base
  let counter = 1

  // Ensure unique keys
  while (existingKeys.has(key)) {
    key = `${base}_${counter++}`
  }

  return key
}

export function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = '',
): Map<string, string> {
  const result = new Map<string, string>()

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      result.set(newKey, value)
    }
    else if (typeof value === 'object' && value !== null) {
      const nested = flattenTranslations(value as Record<string, unknown>, newKey)
      for (const [nestedKey, nestedValue] of nested) {
        result.set(nestedKey, nestedValue)
      }
    }
  }

  return result
}

/**
 * Converts text to a URL-friendly slug
 */
export function toSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'any', // Handles multiple languages
    remove: /[*+~()'"!:@,]/g,
  })
}

/**
 * Extracts meaningful words from text
 * Works with different languages including non-Latin scripts
 */
export function extractKeywords(text: string): string[] {
  // Remove punctuation and extra spaces
  const cleaned = text.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Split into words, filter out short ones
  return cleaned.split(' ')
    .filter(word => word.length >= 2)
    .slice(0, 3) // Take first 3 meaningful words
}

/**
 * Truncates text while preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
}
