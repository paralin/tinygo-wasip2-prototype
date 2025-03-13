import { instantiate, Root } from "./wasm/main.js";
import type { Pollable } from './wasm/interfaces/wasi-io-poll.js'
import * as wasip2Shim from "@bytecodealliance/preview2-shim";

// the types are all wrong, so let's just use any here.
const wasip2 = wasip2Shim as any

// Pollable shim
class PollableShim implements Pollable {
  public block() {
    console.log('pollable shim block')
  }
}

async function run() {
  // Create correct imports structure matching what the wasm expects
  const imports = {
    "wasi:cli/environment": wasip2.cli.environment,
    "wasi:cli/stderr": wasip2.cli.stderr,
    "wasi:cli/stdin": wasip2.cli.stdin,
    "wasi:cli/stdout": wasip2.cli.stdout,
    "wasi:clocks/monotonic-clock": wasip2.clocks.monotonicClock,
    "wasi:clocks/wall-clock": wasip2.clocks.wallClock,
    "wasi:filesystem/preopens": wasip2.filesystem.preopens,
    "wasi:filesystem/types": wasip2.filesystem.types,
    "wasi:io/error": wasip2.io.error,
    "wasi:io/streams": wasip2.io.streams,
    "wasi:random/random": wasip2.random.random,
    "wasi:io/poll": {Pollable: PollableShim},
  };

  console.log("WASI imports:", imports);

  // Define a getBinaryURL function that works in the browser bundle
  const getBinaryURL = async (url: string) => {
    // When bundled, direct file URLs won't work - we need to use the bundled asset URL
    // For browser, we're serving from the project root directory
    const resolvedUrl = new URL(`./wasm/${url}`, window.location.href).href;
    const source = await fetch(resolvedUrl);
    return WebAssembly.compileStreaming(source);
  };

  try {
    // The types are still all wrong in ./wasm/. Use any / unknown here.
    const demo = await (instantiate(getBinaryURL, imports as any) as unknown as Promise<Root>);
    console.log("Demo instantiated successfully:", demo);
    demo.run.run()
  } catch (error) {
    console.error("Failed to instantiate WebAssembly module:", error);
  }
}

run()
