/**
 * Implementation of wasi:clocks/monotonic-clock@0.2.0 interface
 */

import { createTimerPollable } from '../io/poll.js'
import type { Pollable } from '../io/poll.js'
import type * as wasip2Types from '../../types/index.js'
import { Duration } from '../../types/interfaces/wasi-clocks-monotonic-clock.js'

// Type definitions from WASI interface
export type Instant = wasip2Types.clocks.monotonicClock.Instant

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

/**
 * Get the resolution of the monotonic clock
 * @returns Duration in nanoseconds (10 microseconds in this implementation)
 */
function resolution(): Duration {
  return BigInt(10_000) // 10 microseconds in nanoseconds
}

/**
 * Subscribe to a specific instant of time
 * @param when Instant to wait for
 * @returns A Pollable that resolves at the specified time
 */
function subscribeInstant(when: Instant): Pollable {
  const nowTime = now()
  if (when <= nowTime) {
    // Already passed, create immediate pollable
    return createTimerPollable(0)
  }
  // Calculate duration to wait
  const duration = when - nowTime
  return subscribeDuration(duration)
}

export const monotonicClock = {
  now,
  resolution,
  subscribeDuration,
  subscribeInstant,
}
