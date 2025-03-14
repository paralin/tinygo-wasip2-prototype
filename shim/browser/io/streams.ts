/**
 * Implementation of wasi:io/streams@0.2.0 interface
 */

import { Error } from './error.js'
import { Pollable } from './poll.js'

/**
 * Symbol used for resource disposal
 */
const symbolDispose = Symbol.dispose || Symbol.for('dispose')

/**
 * Stream error types
 */
export type StreamError =
  | { tag: 'last-operation-failed'; val: Error }
  | { tag: 'closed' }

/**
 * Interface for input stream handlers
 */
export interface InputStreamHandler {
  blockingRead: (len: bigint) => Uint8Array
  subscribe?: () => Pollable
  drop?: () => void
}

/**
 * Interface for output stream handlers
 */
export interface OutputStreamHandler {
  write: (buf: Uint8Array) => bigint
  flush?: () => void
  blockingFlush: () => void
  drop?: () => void
}

/**
 * Counter for generating unique stream IDs
 */
let streamIdCounter = 0

/**
 * Implementation of WASI InputStream interface
 */
export class InputStream {
  private id: number
  private handler: InputStreamHandler

  /**
   * Create a new input stream with the given handler
   */
  constructor(handler: InputStreamHandler) {
    if (!handler || !handler.blockingRead) {
      throw new Error('Invalid input stream handler')
    }
    this.id = ++streamIdCounter
    this.handler = handler
  }

  /**
   * Read bytes from the stream, blocking until data is available
   * @param len Maximum number of bytes to read
   * @returns Array containing the read bytes
   */
  blockingRead(len: bigint): Uint8Array {
    return this.handler.blockingRead(len)
  }

  /**
   * Resource cleanup when stream is disposed
   */
  [symbolDispose](): void {
    if (this.handler.drop) {
      this.handler.drop()
    }
  }
}

/**
 * Implementation of WASI OutputStream interface
 */
export class OutputStream {
  private id: number
  private open: boolean
  private handler: OutputStreamHandler

  /**
   * Create a new output stream with the given handler
   */
  constructor(handler: OutputStreamHandler) {
    if (!handler || !handler.write || !handler.blockingFlush) {
      throw new Error('Invalid output stream handler')
    }
    this.id = ++streamIdCounter
    this.open = true
    this.handler = handler
  }

  /**
   * Write data to the stream and flush immediately, blocking until complete
   * @param contents Bytes to write to the stream
   */
  blockingWriteAndFlush(contents: Uint8Array): void {
    if (!this.open) {
      throw new Error('Stream closed')
    }
    this.handler.write(contents)
    this.blockingFlush()
  }

  /**
   * Flush any buffered data, blocking until complete
   */
  blockingFlush(): void {
    if (!this.open) {
      throw new Error('Stream closed')
    }
    this.handler.blockingFlush()
  }

  /**
   * Resource cleanup when stream is disposed
   */
  [symbolDispose](): void {
    this.open = false
    if (this.handler.drop) {
      this.handler.drop()
    }
  }
}

export const streams = {
  InputStream,
  OutputStream,
}
