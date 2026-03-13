export function getMissingKeys(referenceKeys: Iterable<string>, targetKeys: Iterable<string>): string[] {
  const targetSet = new Set(targetKeys)
  const missing: string[] = []
  for (const key of referenceKeys) {
    if (!targetSet.has(key)) {
      missing.push(key)
    }
  }
  return missing
}

export function getMissingEntries(
  reference: Record<string, string>,
  target: Record<string, string>,
): Array<{ key: string, defaultValue: string }> {
  const targetSet = new Set(Object.keys(target))
  const missing: Array<{ key: string, defaultValue: string }> = []
  for (const [key, defaultValue] of Object.entries(reference)) {
    if (!targetSet.has(key)) {
      missing.push({ key, defaultValue })
    }
  }
  return missing
}
