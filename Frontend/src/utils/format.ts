export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// Convert date strings to RFC3339 for Go time.Time parsing
export function toISODate(d: string): string {
  if (!d) return ''
  if (d.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(d)) return d
  if (d.includes('T')) return d + ':00Z'  // "2026-04-01T10:00" → "2026-04-01T10:00:00Z"
  return d + 'T00:00:00Z'                 // "2026-04-01" → "2026-04-01T00:00:00Z"
}

export function formatNumber(value: number | string | undefined): string {
  if (value === '' || value === undefined || value === null) return ''
  const n = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value
  if (isNaN(n)) return ''
  return n.toLocaleString('id-ID')
}

export function parseNumber(formatted: string): number {
  const cleaned = formatted.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

export function formatIDR(value: number): string {
  return 'IDR' + Math.round(value).toLocaleString('id-ID')
}
