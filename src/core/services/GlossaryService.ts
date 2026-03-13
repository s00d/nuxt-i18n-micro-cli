import { pathExists } from '../utils/dir'
import { loadJsonFile, writeJsonFile } from '../utils/json'

export interface GlossaryEntry {
  source: string
  target: string
  from?: string
  to?: string
}

export interface GlossaryCatalog {
  entries: GlossaryEntry[]
}

export function loadGlossaryCatalog(filePath: string): GlossaryCatalog {
  if (!pathExists(filePath)) {
    return { entries: [] }
  }
  const raw = loadJsonFile(filePath)
  if (!Array.isArray(raw.entries)) {
    return { entries: [] }
  }
  const entries = raw.entries.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }
    const source = (item as Record<string, unknown>).source
    const target = (item as Record<string, unknown>).target
    const from = (item as Record<string, unknown>).from
    const to = (item as Record<string, unknown>).to
    if (typeof source !== 'string' || typeof target !== 'string') {
      return []
    }
    return [{
      source,
      target,
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined,
    }]
  })
  return { entries }
}

export function saveGlossaryCatalog(filePath: string, catalog: GlossaryCatalog): void {
  writeJsonFile(filePath, catalog)
}

export function addGlossaryEntry(catalog: GlossaryCatalog, entry: GlossaryEntry): void {
  const normalizedFrom = entry.from?.toLowerCase()
  const normalizedTo = entry.to?.toLowerCase()
  const existingIndex = catalog.entries.findIndex(item =>
    item.source === entry.source
    && (item.from?.toLowerCase() ?? undefined) === normalizedFrom
    && (item.to?.toLowerCase() ?? undefined) === normalizedTo,
  )

  const normalizedEntry: GlossaryEntry = {
    source: entry.source,
    target: entry.target,
    from: entry.from,
    to: entry.to,
  }

  if (existingIndex >= 0) {
    catalog.entries[existingIndex] = normalizedEntry
    return
  }

  catalog.entries.push(normalizedEntry)
}

export function removeGlossaryEntry(
  catalog: GlossaryCatalog,
  query: { source: string, from?: string, to?: string },
): number {
  const before = catalog.entries.length
  const normalizedFrom = query.from?.toLowerCase()
  const normalizedTo = query.to?.toLowerCase()
  catalog.entries = catalog.entries.filter((item) => {
    if (item.source !== query.source) {
      return true
    }
    if (normalizedFrom && (item.from?.toLowerCase() ?? '') !== normalizedFrom) {
      return true
    }
    if (normalizedTo && (item.to?.toLowerCase() ?? '') !== normalizedTo) {
      return true
    }
    return false
  })
  return before - catalog.entries.length
}

export function getGlossaryEntriesForPair(
  catalog: GlossaryCatalog,
  fromLang: string,
  toLang: string,
): GlossaryEntry[] {
  const normalizedFrom = fromLang.toLowerCase()
  const normalizedTo = toLang.toLowerCase()
  return catalog.entries.filter((entry) => {
    const entryFrom = entry.from?.toLowerCase()
    const entryTo = entry.to?.toLowerCase()
    const fromMatch = !entryFrom || entryFrom === normalizedFrom
    const toMatch = !entryTo || entryTo === normalizedTo
    return fromMatch && toMatch
  })
}

export function buildGlossaryContext(entries: GlossaryEntry[]): string | undefined {
  if (entries.length === 0) {
    return undefined
  }
  return entries
    .slice(0, 100)
    .map(entry => `${entry.source} => ${entry.target}`)
    .join('\n')
}
