/**
 * Implementation of wasi:io/poll@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'

/**
 * Global dummy SharedArrayBuffer for Atomics.wait operations
 * Used for implementing thread blocking functionality in browsers
 */
const globalSharedBuffer = new SharedArrayBuffer(4)
const globalSharedArray = new Int32Array(globalSharedBuffer)

// Initialize the value to 0
Atomics.store(globalSharedArray, 0, 0)

/**
 * Data structure for storing pollable types and associated data
 */
type PollableData = {
  timer?: { durationMs: number }
  // Add more types here as needed
}

/**
 * Pollable class implementing the WASI Preview2 pollable interface
 * Used for blocking operations like timers or IO waiting
 */
export class Pollable implements wasip2Types.io.poll.Pollable {
  private type: keyof PollableData
  private data: PollableData
  private static counter = 0

  // Constructor used internally - external code should use static factory methods
  constructor(type: keyof PollableData, data: PollableData) {
    this.type = type
    this.data = data
    Pollable.counter++
  }

  /**
   * Static factory method - creates a new Pollable
   * This satisfies typechecking by having a parameterless constructor signature
   * The real implementation still uses the original constructor internally
   */
  public static create(): Pollable {
    return new Pollable('timer', { timer: { durationMs: 0 } })
  }

  /**
   * Return the readiness of a pollable. This function never blocks.
   * Returns true when the pollable is ready, and false otherwise.
   */
  public ready(): boolean {
    if (this.type === 'timer' && this.data.timer) {
      // For timer pollables, check if the duration has elapsed
      const startTime = Date.now() - this.data.timer.durationMs
      return startTime >= 0
    }
    return false
  }

  /**
   * Block the current thread until the pollable condition is satisfied
   */
  public block(): void {
    if (this.type === 'timer' && this.data.timer) {
      const { durationMs } = this.data.timer

      // Use Atomics.wait with the duration as timeout
      // This will always time out after the specified duration
      Atomics.wait(globalSharedArray, 0, 0, durationMs)
    } else {
      throw new Error(`Unsupported pollable type: ${this.type}`)
    }
  }
}

/**
 * Create a timer pollable that blocks for the specified duration
 * @param durationMs Duration in milliseconds
 */
export function createTimerPollable(durationMs: number): Pollable {
  return new Pollable('timer', { timer: { durationMs } })
}

/**
 * Poll on a list of pollables, blocking until at least one is ready
 * @param in_ Array of pollables to poll
 * @returns Array of indices of ready pollables
 */
function pollFn(in_: wasip2Types.io.poll.Pollable[]): Uint32Array {
  if (in_.length === 0) {
    throw new Error('Poll list cannot be empty')
  }

  if (in_.length > 0xffffffff) {
    throw new Error('Poll list is too large')
  }

  // Check if any pollables are ready without blocking
  for (let i = 0; i < in_.length; i++) {
    if (in_[i].ready()) {
      return new Uint32Array([i])
    }
  }

  // No pollables ready, block on the first one
  // This is a simplified implementation - a full implementation
  // would use a more sophisticated event-driven approach
  in_[0].block()
  return new Uint32Array([0])
}

export const poll = {
  Pollable,
  poll: pollFn,
}
