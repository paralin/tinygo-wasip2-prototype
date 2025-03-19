/**
 * Implementation of CLI stream handlers for stdin, stdout, and stderr
 */

import {
  InputStream,
  OutputStream,
  InputStreamHandler,
  OutputStreamHandler,
} from '../io/streams.js'
import type * as wasip2Types from '../../types/index.js'

// Text decoder for converting Uint8Array to string
const textDecoder = new TextDecoder()

// Symbol for dispose method
const symbolDispose = Symbol.dispose || Symbol.for('dispose')

/**
 * Default stdin implementation
 * This is a basic implementation that doesn't actually read from anywhere
 * In a full implementation, this would connect to user input
 */
const stdinHandler: InputStreamHandler = {
  blockingRead(_len: bigint): Uint8Array {
    // Return empty array by default
    // In a real implementation, this would block until input is available
    return new Uint8Array(0)
  },
}

/**
 * Default stdout implementation that writes to console.log
 */
const stdoutHandler: OutputStreamHandler = {
  write(contents: Uint8Array): bigint {
    // If the last character is a newline, remove it (console.log adds one)
    if (contents.length > 0 && contents[contents.length - 1] === 10) {
      contents = contents.subarray(0, contents.length - 1)
    }

    // Write to console.log
    console.log(textDecoder.decode(contents))

    return BigInt(contents.length)
  },

  blockingFlush(): void {
    // Nothing to do for console.log
  },
}

/**
 * Default stderr implementation that writes to console.error
 */
const stderrHandler: OutputStreamHandler = {
  write(contents: Uint8Array): bigint {
    // If the last character is a newline, remove it (console.error adds one)
    if (contents.length > 0 && contents[contents.length - 1] === 10) {
      contents = contents.subarray(0, contents.length - 1)
    }

    // Write to console.error
    console.error(textDecoder.decode(contents))

    return BigInt(contents.length)
  },

  blockingFlush(): void {
    // Nothing to do for console.error
  },
}

// Create stream instances
const stdinStream = new InputStream(stdinHandler)
const stdoutStream = new OutputStream(stdoutHandler)
const stderrStream = new OutputStream(stderrHandler)

/**
 * Set a custom handler for stdin
 */
export function setStdinHandler(handler: InputStreamHandler): void {
  // In production code, we would replace the handler
  // but for now we just warn that this isn't implemented
  console.warn('Custom stdin handler not implemented')
}

/**
 * Set a custom handler for stdout
 */
export function setStdoutHandler(handler: OutputStreamHandler): void {
  // In production code, we would replace the handler
  // but for now we just warn that this isn't implemented
  console.warn('Custom stdout handler not implemented')
}

/**
 * Set a custom handler for stderr
 */
export function setStderrHandler(handler: OutputStreamHandler): void {
  // In production code, we would replace the handler
  // but for now we just warn that this isn't implemented
  console.warn('Custom stderr handler not implemented')
}

/**
 * Get the standard input stream
 */
function getStdin(): InputStream {
  return stdinStream
}

/**
 * Get the standard output stream
 */
function getStdout(): OutputStream {
  return stdoutStream
}

/**
 * Get the standard error stream
 */
function getStderr(): OutputStream {
  return stderrStream
}

// Export modules
export const stdin = {
  getStdin,
}

export const stdout = {
  getStdout,
}

export const stderr = {
  getStderr,
}
