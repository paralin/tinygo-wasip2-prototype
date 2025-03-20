/**
 * Implementation of wasi:clocks/monotonic-clock@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'

export type Instant = wasip2Types.clocks.monotonicClock.Instant

/**
 * Get current time as nanoseconds since an arbitrary point
 * @returns Current time as nanoseconds
 */
function now(): Instant {
  // performance.now() is in milliseconds, but we want nanoseconds
  return BigInt(Math.floor(performance.now() * 1_000_000))
}

export const monotonicClock = {
  now,
}
