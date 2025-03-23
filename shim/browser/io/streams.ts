/**
 * Implementation of wasi:io/streams@0.2.0 interface
 */

import { Pollable, createTimerPollable } from './poll.js'
import type * as wasip2Types from '../../types/index.js'
import { WasiIoError } from './error.js'

/**
 * Symbol used for resource disposal
 */
const symbolDispose = Symbol.dispose || Symbol.for('dispose')

/**
 * Implements the closed stream error
 */
export class StreamClosedError
  extends WasiIoError
  implements wasip2Types.io.streams.StreamErrorClosed
{
  tag: 'closed' = 'closed'

  constructor() {
    super('Stream is closed')
    this.name = 'StreamClosedError'
    this.payload = {tag: this.tag, val: undefined}
  }
}

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
export class InputStream implements wasip2Types.io.streams.InputStream {
  private id: number
  private handler: InputStreamHandler
  private isOpen: boolean = true

  /**
   * Create a new input stream with default empty handler
   * This satisfies the requirement for a parameterless constructor
   */
  constructor() {
    this.id = ++streamIdCounter
    // Create a dummy handler that returns empty data
    this.handler = {
      blockingRead: () => new Uint8Array(0),
    }
  }

  /**
   * Static factory method to create an empty InputStream
   */
  public static create(): InputStream {
    return new InputStream()
  }

  /**
   * Static factory method to create an InputStream with a handler
   * @param handler The handler for stream operations
   */
  public static withHandler(handler: InputStreamHandler): InputStream {
    if (!handler || !handler.blockingRead) {
      throw new Error('Invalid input stream handler')
    }
    const stream = new InputStream()
    stream.handler = handler
    return stream
  }

  /**
   * Set a new handler for this input stream
   * @param handler The handler for stream operations
   */
  public setHandler(handler: InputStreamHandler): void {
    if (!handler || !handler.blockingRead) {
      throw new Error('Invalid input stream handler')
    }

    // Clean up the old handler if it has a drop method
    if (this.isOpen && this.handler.drop) {
      this.handler.drop()
    }

    this.handler = handler
  }

  /**
   * Read bytes from the stream without blocking
   * @param len Maximum number of bytes to read
   * @returns Array containing the read bytes
   */
  read(len: bigint): Uint8Array {
    if (!this.isOpen) {
      throw new StreamClosedError()
    }
    // This is a basic implementation that returns empty array
    // A full implementation would read without blocking
    return new Uint8Array(0)
  }

  /**
   * Read bytes from the stream, blocking until data is available
   * @param len Maximum number of bytes to read
   * @returns Array containing the read bytes
   */
  blockingRead(len: bigint): Uint8Array {
    if (!this.isOpen) {
      throw new StreamClosedError()
    }
    return this.handler.blockingRead(len)
  }

  /**
   * Skip bytes from the stream
   * @param len Number of bytes to skip
   * @returns Number of bytes skipped
   */
  skip(len: bigint): bigint {
    if (!this.isOpen) {
      throw new StreamClosedError()
    }
    // Basic implementation just returns the length
    // A full implementation would actually skip bytes
    return BigInt(0)
  }

  /**
   * Skip bytes from the stream, blocking until bytes are available
   * @param len Number of bytes to skip
   * @returns Number of bytes skipped
   */
  blockingSkip(len: bigint): bigint {
    if (!this.isOpen) {
      throw new StreamClosedError()
    }
    // Simplified implementation that doesn't actually skip
    return BigInt(0)
  }

  /**
   * Create a pollable that will resolve when the stream has data
   * @returns Pollable for this stream
   */
  subscribe(): Pollable {
    // Create a simple timer pollable as a placeholder
    // A real implementation would create a pollable for stream readiness
    return createTimerPollable(0)
  }

  /**
   * Resource cleanup when stream is disposed
   */
  [symbolDispose](): void {
    this.isOpen = false
    if (this.handler.drop) {
      this.handler.drop()
    }
  }
}

/**
 * Implementation of WASI OutputStream interface
 */
export class OutputStream implements wasip2Types.io.streams.OutputStream {
  private id: number
  private open: boolean
  private handler: OutputStreamHandler
  private isWritable: boolean = true

  /**
   * Create a new output stream with default empty handler
   * This satisfies the requirement for a parameterless constructor
   */
  constructor() {
    this.id = ++streamIdCounter
    this.open = true
    // Create a dummy handler that does nothing
    this.handler = {
      write: () => BigInt(0),
      blockingFlush: () => {},
    }
  }

  /**
   * Static factory method to create an empty OutputStream
   */
  public static create(): OutputStream {
    return new OutputStream()
  }

  /**
   * Static factory method to create an OutputStream with a handler
   * @param handler The handler for stream operations
   */
  public static withHandler(handler: OutputStreamHandler): OutputStream {
    if (!handler || !handler.write || !handler.blockingFlush) {
      throw new Error('Invalid output stream handler')
    }
    const stream = new OutputStream()
    stream.handler = handler
    return stream
  }

  /**
   * Set a new handler for this output stream
   * @param handler The handler for stream operations
   */
  public setHandler(handler: OutputStreamHandler): void {
    if (!handler || !handler.write || !handler.blockingFlush) {
      throw new Error('Invalid output stream handler')
    }

    // Clean up the old handler if it has a drop method
    if (this.open && this.handler.drop) {
      this.handler.drop()
    }

    this.handler = handler
  }

  /**
   * Check if the stream is ready for writing
   * @returns Number of bytes allowed for next write
   */
  checkWrite(): bigint {
    if (!this.open) {
      throw new StreamClosedError()
    }

    if (!this.isWritable) {
      return BigInt(0)
    }

    // Basic implementation allows 4KB writes
    return BigInt(4096)
  }

  /**
   * Write data to the stream
   * @param contents Bytes to write to the stream
   */
  write(contents: Uint8Array): void {
    if (!this.open) {
      throw new StreamClosedError()
    }

    // Check if we can write this much data
    const maxBytes = Number(this.checkWrite())
    if (contents.byteLength > maxBytes) {
      throw new Error('Write exceeds permitted length')
    }

    this.handler.write(contents)
  }

  /**
   * Write data to the stream and flush immediately, blocking until complete
   * @param contents Bytes to write to the stream
   */
  blockingWriteAndFlush(contents: Uint8Array): void {
    if (!this.open) {
      throw new StreamClosedError()
    }
    this.handler.write(contents)
    this.blockingFlush()
  }

  /**
   * Flush any buffered data without blocking
   */
  flush(): void {
    if (!this.open) {
      throw new StreamClosedError()
    }

    if (this.handler.flush) {
      this.handler.flush()
    }

    // Mark stream as not writable until flush completes
    this.isWritable = false
  }

  /**
   * Flush any buffered data, blocking until complete
   */
  blockingFlush(): void {
    if (!this.open) {
      throw new StreamClosedError()
    }
    this.handler.blockingFlush()
    this.isWritable = true
  }

  /**
   * Create a pollable that will resolve when the stream is ready for writing
   * @returns Pollable for this stream
   */
  subscribe(): Pollable {
    // Create a simple timer pollable as a placeholder
    // A real implementation would create a pollable for stream readiness
    return createTimerPollable(0)
  }

  /**
   * Write zeroes to the stream
   * @param len Number of zeroes to write
   */
  writeZeroes(len: bigint): void {
    if (!this.open) {
      throw new StreamClosedError()
    }

    // Check if we can write this much data
    const maxBytes = Number(this.checkWrite())
    if (Number(len) > maxBytes) {
      throw new Error('Write exceeds permitted length')
    }

    // Create a buffer of zeroes
    const zeroes = new Uint8Array(Number(len))
    this.handler.write(zeroes)
  }

  /**
   * Write zeroes to the stream and flush, blocking until complete
   * @param len Number of zeroes to write
   */
  blockingWriteZeroesAndFlush(len: bigint): void {
    if (!this.open) {
      throw new StreamClosedError()
    }

    // Create a buffer of zeroes
    const zeroes = new Uint8Array(Number(len))
    this.handler.write(zeroes)
    this.blockingFlush()
  }

  /**
   * Read from an input stream and write to this output stream
   * @param src Input stream to read from
   * @param len Maximum number of bytes to transfer
   * @returns Number of bytes transferred
   */
  splice(src: InputStream, len: bigint): bigint {
    if (!this.open) {
      throw new StreamClosedError()
    }

    // Check how much we can write
    const maxBytes = this.checkWrite()
    const bytesToRead = maxBytes < len ? maxBytes : len

    // Read from the input stream
    const data = src.read(bytesToRead)

    // Write to this output stream
    this.write(data)

    return BigInt(data.byteLength)
  }

  /**
   * Read from an input stream and write to this output stream, blocking if needed
   * @param src Input stream to read from
   * @param len Maximum number of bytes to transfer
   * @returns Number of bytes transferred
   */
  blockingSplice(src: InputStream, len: bigint): bigint {
    if (!this.open) {
      throw new StreamClosedError()
    }

    // Check how much we can write
    const maxBytes = this.checkWrite()
    const bytesToRead = maxBytes < len ? maxBytes : len

    // Read from the input stream, blocking if needed
    const data = src.blockingRead(bytesToRead)

    // Write to this output stream
    this.write(data)

    return BigInt(data.byteLength)
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
