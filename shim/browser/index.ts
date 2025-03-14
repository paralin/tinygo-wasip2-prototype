import { monotonicClock, wallClock } from "./clocks.js";
import { Pollable } from "./poll.js";
import * as cli from './cli.js'
import * as filesystem from './filesystem.js'
import * as io from './io.js'
import * as random from './random.js'

// Create correct imports structure matching what the wasm expects
export const wasip2 = {
  "wasi:cli/environment": cli.environment,
  "wasi:cli/stderr": cli.stderr,
  "wasi:cli/stdin": cli.stdin,
  "wasi:cli/stdout": cli.stdout,
  "wasi:filesystem/preopens": filesystem.preopens,
  "wasi:filesystem/types": filesystem.types,
  "wasi:io/error": io.error,
  "wasi:io/streams": io.streams,
  "wasi:random/random": random.random,
  "wasi:io/poll": { Pollable },

  // Use our custom clock implementations with Atomics.wait support
  "wasi:clocks/monotonic-clock": monotonicClock,
  "wasi:clocks/wall-clock": wallClock,
};
