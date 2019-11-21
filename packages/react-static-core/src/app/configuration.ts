// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const PrefetchExclusions = (() =>
  new (class PrefetchExclusions {
    private exclusions: string[]

    constructor() {
      this.exclusions = []
    }

    public add(...options: string[] | Array<string | string[]>): void {
      this.exclusions.push(...options.flat(2).map(PrefetchExclusions.normalize))
    }

    public contains(path: string): boolean {
      return this.exclusions.indexOf(PrefetchExclusions.normalize(path)) !== -1
    }

    private static normalize(path: string): string {
      return path.trim().replace(/\/$/, '')
    }
  })())()

/**
 * @deprecated use PrefetchExclusions.add instead
 */
export function addPrefetchExcludes(array: string[]): void {
  console.warn(
    'addPrefetchExcludes is deprecated. Use PrefetchExclusions.add instead'
  )
  return PrefetchExclusions.add(...array)
}
