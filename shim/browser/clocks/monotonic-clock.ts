/**
 * Implementation of wasi:clocks/monotonic-clock@0.2.0 interface
 */

import { createTimerPollable } from '../io/poll.js'
import type { Pollable } from '../io/poll.js'

// Type definitions from WASI interface
export type Instant = bigint
export type Duration = bigint

/**
 * Convert nanoseconds to milliseconds
 */
function nsToMs(ns: bigint): number {
  return Number(ns / 1_000_000n)
}

/**
 * Get current time as nanoseconds since an arbitrary point
 * @returns Current time as nanoseconds
 */
function now(): Instant {
  // performance.now() is in milliseconds, but we want nanoseconds
  return BigInt(Math.floor(performance.now() * 1_000_000))
}

/**
 * Subscribe to a timer that resolves after a specified duration
 * @param when Duration in nanoseconds
 * @returns A Pollable that resolves after the specified duration
 */
function subscribeDuration(when: Duration): Pollable {
  // Convert nanoseconds to milliseconds
  const durationMs = nsToMs(when)

  // Create a Pollable that will block for the specified duration
  return createTimerPollable(durationMs)
}

export const monotonicClock = {
  now,
  subscribeDuration,
}
