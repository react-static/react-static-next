export class FetchError extends Error {
  public readonly status: number
  constructor(message: string, { status }: { status: number }) {
    super(message)

    this.status = status

    Error.captureStackTrace(this, this.constructor)
  }
}
