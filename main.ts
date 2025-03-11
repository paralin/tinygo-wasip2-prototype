import { instantiate } from "./wasm/main.js";
import * as wasip2 from "@bytecodealliance/preview2-shim";

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
    "wasi:random/random": wasip2.random.random
  };
  
  console.log("WASI imports:", imports);

  // Define a getBinaryURL function that works in the browser bundle
  const getBinaryURL = (url: string) => {
    // When bundled, direct file URLs won't work - we need to use the bundled asset URL
    // For browser, we're serving from the project root directory
    const resolvedUrl = new URL(`./wasm/${url}`, window.location.href).href;
    return fetch(resolvedUrl).then(WebAssembly.compileStreaming);
  };

  try {
    const demo = await instantiate(getBinaryURL, imports);
    console.log("Demo instantiated successfully:", demo);
    demo.run.run()
  } catch (error) {
    console.error("Failed to instantiate WebAssembly module:", error);
  }
}

run()
