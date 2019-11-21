export function isDevelopment(): boolean {
  return process.env.REACT_STATIC_ENV === 'development'
}
