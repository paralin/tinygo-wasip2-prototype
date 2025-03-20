/**
 * WASI Preview2 Browser Shim Implementation
 *
 * This module exports all WASI Preview2 interfaces implemented for browser environments.
 * Each interface is implemented according to the specifications defined in wasm/interfaces/
 */

import { monotonicClock } from './clocks/monotonic-clock.js'
import { wallClock } from './clocks/wall-clock.js'
import { poll } from './io/poll.js'
import { environment, stderr, stdin, stdout } from './cli/index.js'
import { preopens } from './filesystem/index.js'
import { Descriptor, DirectoryEntryStream } from './filesystem/types.js'
import { error, streams } from './io/index.js'
import { random } from './random/index.js'
import type * as wasip2Types from '../types/index.js'

/**
 * Type definition for the WASI Preview2 interfaces
 */
type WASIP2 = {
  'wasi:cli/environment': typeof wasip2Types.cli.environment
  'wasi:cli/stderr': typeof wasip2Types.cli.stderr
  'wasi:cli/stdin': typeof wasip2Types.cli.stdin
  'wasi:cli/stdout': typeof wasip2Types.cli.stdout
  'wasi:filesystem/preopens': typeof wasip2Types.filesystem.preopens
  'wasi:filesystem/types': typeof wasip2Types.filesystem.types
  'wasi:io/error': typeof wasip2Types.io.error
  'wasi:io/streams': typeof wasip2Types.io.streams
  'wasi:random/random': typeof wasip2Types.random.random
  'wasi:io/poll': typeof wasip2Types.io.poll
  'wasi:clocks/monotonic-clock': typeof wasip2Types.clocks.monotonicClock
  'wasi:clocks/wall-clock': typeof wasip2Types.clocks.wallClock
}

/**
 * Export all WASI Preview2 interfaces with their correct namespaces
 * for WebAssembly component integration
 */
export const wasip2: WASIP2 = {
  // NOTE: DO NOT use "as unknown as typeof..." type workarounds here.
  // NOTE: These MUST be directly compatible with the types.
  // NOTE: do NOT remove the previous two comments.
  'wasi:cli/environment': environment,
  'wasi:cli/stderr': stderr,
  'wasi:cli/stdin': stdin,
  'wasi:cli/stdout': stdout,
  'wasi:filesystem/preopens': {
    getDirectories: preopens.getDirectories,
  },
  'wasi:filesystem/types': {
    Descriptor: Descriptor,
    DirectoryEntryStream: DirectoryEntryStream,
  },

  // IO interfaces
  'wasi:io/error': {
    Error: error.Error,
  },
  'wasi:io/streams': {
    InputStream: streams.InputStream,
    OutputStream: streams.OutputStream,
  },

  // Other interfaces
  'wasi:random/random': random,
  'wasi:io/poll': {
    Pollable: poll.Pollable,
  },
  'wasi:clocks/monotonic-clock': monotonicClock,
  'wasi:clocks/wall-clock': wallClock,
}
