/**
 * Implementation of CLI stream handlers for stdin, stdout, and stderr
 */

import {
  InputStream,
  OutputStream,
  InputStreamHandler,
  OutputStreamHandler,
} from '../io/streams.js'

// Text decoder for converting Uint8Array to string
const textDecoder = new TextDecoder()

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
const stdinStream = InputStream.withHandler(stdinHandler)
const stdoutStream = OutputStream.withHandler(stdoutHandler)
const stderrStream = OutputStream.withHandler(stderrHandler)

/**
 * Set a custom handler for stdin
 */
export function setStdinHandler(handler: InputStreamHandler): void {
  stdinStream.setHandler(handler)
}

/**
 * Set a custom handler for stdout
 */
export function setStdoutHandler(handler: OutputStreamHandler): void {
  stdoutStream.setHandler(handler)
}

/**
 * Set a custom handler for stderr
 */
export function setStderrHandler(handler: OutputStreamHandler): void {
  stderrStream.setHandler(handler)
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
