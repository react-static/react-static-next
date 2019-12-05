export function sanitizeName(name: string): string {
  return name
    .replace(/[@.-]/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
}
