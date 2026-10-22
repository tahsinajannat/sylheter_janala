/** Thrown by the API client for every non-2xx response and for network failures. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound() {
    return this.status === 404;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  /** Network failure / API down (no HTTP status). */
  get isNetwork() {
    return this.status === 0;
  }
}
