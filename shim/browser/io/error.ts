/**
 * Implementation of wasi:io/error@0.2.0 interface
 */

/**
 * Error class that represents a WASI IO error
 */
export class Error extends globalThis.Error {
  payload: string;

  constructor(message: string) {
    super(message);
    this.name = 'WasiIOError';
    this.payload = message;
  }

  /**
   * Get a debug string representation of the error
   */
  toDebugString(): string {
    return this.message;
  }
}

export const error = {
  Error,
}
