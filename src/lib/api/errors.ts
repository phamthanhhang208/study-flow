export class YouComApiError extends Error {
  public status: number
  public endpoint: string

  constructor(
    message: string,
    status: number,
    endpoint: string,
  ) {
    super(message)
    this.name = "YouComApiError"
    this.status = status
    this.endpoint = endpoint
  }
}

export class YouComRateLimitError extends YouComApiError {
  public retryAfterMs: number

  constructor(endpoint: string, retryAfter?: string) {
    const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60_000
    super(`Rate limited on ${endpoint}. Retry after ${retryMs}ms`, 429, endpoint)
    this.name = "YouComRateLimitError"
    this.retryAfterMs = retryMs
  }
}

export class YouComTimeoutError extends YouComApiError {
  constructor(endpoint: string, timeoutMs: number) {
    super(`Request to ${endpoint} timed out after ${timeoutMs}ms`, 0, endpoint)
    this.name = "YouComTimeoutError"
  }
}
