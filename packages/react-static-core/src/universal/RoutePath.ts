export class RoutePath {
  public readonly path: string

  public static normalize(path: string | RoutePath): string {
    if (typeof path !== 'string') {
      return RoutePath.normalize(path.path)
    }

    const normalised = path.trim()
      .replace(/\/+/g, '/')
      .replace(/^\//, '')
      .replace(/\/$/, '')

    // TODO: strip relative path from root??
    return '/' + normalised
  }

  constructor(denormalisedPath: string) {
    this.path = RoutePath.normalize(denormalisedPath)
  }

  public valueOf(): string {
    return this.path
  }

  public toString(): string {
    return this.path
  }
}
