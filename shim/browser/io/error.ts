/**
 * Implementation of wasi:io/error@0.2.0 interface
 */

/**
 * Error class that represents a WASI IO error
 */
export class Error {
  private message: string

  constructor(message: string) {
    this.message = message
  }

  /**
   * Get a debug string representation of the error
   */
  toDebugString(): string {
    return this.message
  }
}

export const error = {
  Error,
}
