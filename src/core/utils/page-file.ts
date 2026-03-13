export function normalizePageScope(scope: string): string {
  return scope
    .split('\\')
    .join('/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
}

export function buildPageLocaleRelativeFile(pageScope: string, localeCode: string): string {
  return `pages/${normalizePageScope(pageScope)}/${localeCode}.json`
}

export function parsePageScopeFromRelativeFile(filePath: string, localeCode: string): string | null {
  const normalized = normalizePageScope(filePath)
  const match = normalized.match(new RegExp(`^pages/(.+)/${localeCode}\\.json$`))
  if (!match) {
    return null
  }
  return match[1]
}
