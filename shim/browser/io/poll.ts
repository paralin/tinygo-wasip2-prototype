/**
 * Implementation of wasi:io/poll@0.2.0 interface
 */

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
export class Pollable {
  private type: keyof PollableData
  private data: PollableData

  constructor(type: keyof PollableData, data: PollableData) {
    this.type = type
    this.data = data
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
 * @param list Array of pollables to poll
 * @returns Index of the first ready pollable
 */
function pollList(list: Pollable[]): number {
  // For now, simple implementation just waits on the first pollable
  // This should be improved in a production implementation
  if (list.length > 0) {
    list[0].block()
    return 0
  }
  return -1
}

/**
 * Poll on a single pollable, blocking until it's ready
 * @param pollable The pollable to wait on
 */
function pollOne(pollable: Pollable): void {
  pollable.block()
}

export const poll = {
  Pollable,
  pollList,
  pollOne,
}
