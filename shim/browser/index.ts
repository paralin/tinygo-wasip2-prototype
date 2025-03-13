import * as wasip2Shim from "@bytecodealliance/preview2-shim";
import { monotonicClock, wallClock } from "./clocks.js";
import { Pollable } from "./poll.js";

// The types are all wrong, so let's just use any here.
const wasip2Raw = wasip2Shim as any;

// Create correct imports structure matching what the wasm expects
export const wasip2 = {
  "wasi:cli/environment": wasip2Raw.cli.environment,
  "wasi:cli/stderr": wasip2Raw.cli.stderr,
  "wasi:cli/stdin": wasip2Raw.cli.stdin,
  "wasi:cli/stdout": wasip2Raw.cli.stdout,
  "wasi:filesystem/preopens": wasip2Raw.filesystem.preopens,
  "wasi:filesystem/types": wasip2Raw.filesystem.types,
  "wasi:io/error": wasip2Raw.io.error,
  "wasi:io/streams": wasip2Raw.io.streams,
  "wasi:random/random": wasip2Raw.random.random,
  "wasi:io/poll": { Pollable },
  
  // Use our custom clock implementations with Atomics.wait support
  "wasi:clocks/monotonic-clock": monotonicClock,
  "wasi:clocks/wall-clock": wallClock,
};
