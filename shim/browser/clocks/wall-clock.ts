/**
 * Implementation of wasi:clocks/wall-clock@0.2.0 interface
 */

// Type definition from WASI interface
export interface Datetime {
  seconds: bigint
  nanoseconds: number
}

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

export const wallClock = {
  now,
}
