import { instantiate, Root } from "./wasm/main.js";
import { wasip2 } from "./shim/browser/index.js";

async function run() {
  console.log("WASI imports:", wasip2);

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
    const demo = await (instantiate(getBinaryURL, wasip2 as any) as unknown as Promise<Root>);
    console.log("Demo instantiated successfully:", demo);
    demo.run.run()
  } catch (error) {
    console.error("Failed to instantiate WebAssembly module:", error);
  }
}

run()
