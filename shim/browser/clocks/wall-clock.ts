/**
 * Implementation of wasi:clocks/wall-clock@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'

// Type definition from WASI interface
export type Datetime = wasip2Types.clocks.wallClock.Datetime

/**
 * Get the current wall clock time
 * @returns Current datetime in seconds and nanoseconds
 */
function now(): Datetime {
  const nowMs = Date.now() // in milliseconds
  const seconds = BigInt(Math.floor(nowMs / 1000))
  const nanoseconds = (nowMs % 1000) * 1_000_000

  return { seconds, nanoseconds }
}

/**
 * Get the resolution of the wall clock
 * @returns Resolution in seconds and nanoseconds
 */
function resolution(): Datetime {
  return { seconds: BigInt(0), nanoseconds: 1_000_000 } // 1 millisecond resolution
}

export const wallClock = {
  now,
  resolution,
}
