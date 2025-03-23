/**
 * Implementation of wasi:io/poll@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'
import {
  InputStream,
  InputStreamHandler,
  OutputStream,
  OutputStreamHandler,
} from './streams.js'

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
}

/**
 * Pollable class implementing the WASI Preview2 pollable interface
 * Used for blocking operations like timers or IO waiting
 */
export class Pollable implements wasip2Types.io.poll.Pollable {
  private type: keyof PollableData
  private data: PollableData
  private static counter = 0

  /**
   * Create a new Pollable with default values
   * This satisfies the requirement for a parameterless constructor
   */
  constructor() {
    this.type = 'timer'
    this.data = { timer: { durationMs: 0 } }
    Pollable.counter++
  }

  /**
   * Static factory method - creates a new Pollable with specific type and data
   */
  public static create(): Pollable {
    return new Pollable()
  }

  /**
   * Static factory method to create a timer-based Pollable
   * @param durationMs Duration in milliseconds
   */
  public static withTimer(durationMs: number): Pollable {
    const pollable = new Pollable()
    pollable.type = 'timer'
    pollable.data = { timer: { durationMs } }
    return pollable
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
  return Pollable.withTimer(durationMs)
}

/**
 * Create an input stream with the given handler
 * @param handler The handler for stream operations
 */
export function createInputStream(handler: InputStreamHandler): InputStream {
  return InputStream.withHandler(handler)
}

/**
 * Create an output stream with the given handler
 * @param handler The handler for stream operations
 */
export function createOutputStream(handler: OutputStreamHandler): OutputStream {
  return OutputStream.withHandler(handler)
}

/**
 * Check if an object is a Pollable with a ready function
 * @param obj Object to check
 * @returns True if the object has a ready function
 */
function isPollable(obj: any): obj is Pollable {
  return obj && (obj instanceof Pollable || typeof obj.ready === 'function')
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
    const x = in_[i]
    if (isPollable(x) && x.ready()) {
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
