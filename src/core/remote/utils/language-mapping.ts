export function toRemoteLocale(
  localLocale: string,
  mapping: Record<string, string> | undefined,
): string {
  return mapping?.[localLocale] || localLocale
}

export function toLocalLocale(
  remoteLocale: string,
  mapping: Record<string, string> | undefined,
): string {
  if (!mapping) {
    return remoteLocale
  }
  for (const [local, remote] of Object.entries(mapping)) {
    if (remote === remoteLocale) {
      return local
    }
  }
  return remoteLocale
}
