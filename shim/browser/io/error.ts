/**
 * Implementation of wasi:io/error@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'

/**
 * WasiIoError represents a WASI IO error
 */
export class WasiIoError extends Error implements wasip2Types.io.error.Error {
  payload?: any

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'WasiIOError'
  }

  /**
   * Get a debug string representation of the error
   */
  toDebugString(): string {
    return this.message
  }
}

/**
 * LastOperationFailedError implements the error for streamsErrorLastOperationFailed
 */
export class LastOperationFailedError
  extends WasiIoError
  implements wasip2Types.io.streams.StreamErrorLastOperationFailed
{
  tag: 'last-operation-failed' = 'last-operation-failed'
  val: wasip2Types.io.error.Error

  constructor(error: wasip2Types.io.error.Error) {
    super(`Last operation failed`)
    this.name = 'LastOperationFailedError'
    this.val = error
  }
}

/**
 * Error constructor for WASI
 */
class IoError extends WasiIoError {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
  }

  /**
   * Static factory method to create an IoError
   * Used to satisfy typechecking requirements
   */
  public static create(): IoError {
    return new IoError('Generic IO Error')
  }
}

export const error = {
  Error: IoError,
}
