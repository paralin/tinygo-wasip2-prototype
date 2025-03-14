/**
 * WASI Preview2 Browser Shim Implementation
 *
 * This module exports all WASI Preview2 interfaces implemented for browser environments.
 * Each interface is implemented according to the specifications defined in wasm/interfaces/
 */

import { monotonicClock } from './clocks/monotonic-clock.js'
import { wallClock } from './clocks/wall-clock.js'
import { poll } from './io/poll.js'
import {
  environment,
  stderr,
  stdin,
  stdout,
} from './cli/index.js'
import { preopens, types } from './filesystem/index.js'
import { error, streams } from './io/index.js'
import { random } from './random/index.js'

/**
 * Export all WASI Preview2 interfaces with their correct namespaces
 * for WebAssembly component integration
 */
export const wasip2 = {
  'wasi:cli/environment': environment,
  'wasi:cli/stderr': stderr,
  'wasi:cli/stdin': stdin,
  'wasi:cli/stdout': stdout,
  'wasi:filesystem/preopens': preopens,
  'wasi:filesystem/types': types,
  'wasi:io/error': error,
  'wasi:io/streams': streams,
  'wasi:random/random': random,
  'wasi:io/poll': poll,
  'wasi:clocks/monotonic-clock': monotonicClock,
  'wasi:clocks/wall-clock': wallClock,
}
