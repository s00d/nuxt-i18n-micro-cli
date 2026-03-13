import prettyBytes from 'pretty-bytes'

const binaryToLegacyUnit: Record<string, string> = {
  KiB: 'KB',
  MiB: 'MB',
  GiB: 'GB',
  TiB: 'TB',
  PiB: 'PB',
  EiB: 'EB',
}

export function formatBytes(bytes: number): string {
  const formatted = prettyBytes(bytes, {
    binary: true,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  const [valuePart = '0', unitPart = 'B'] = formatted.split(' ')
  const normalizedUnit = binaryToLegacyUnit[unitPart] ?? unitPart
  const normalizedValue = /^\d+$/.test(valuePart) ? `${valuePart}.0` : valuePart

  return `${normalizedValue} ${normalizedUnit}`
}
