import { instantiate } from "./wasm/main.js";
import * as wasip2 from "@bytecodealliance/preview2-shim";

async function run() {
  const demo = await instantiate(
    (url) => fetch(new URL(`./wasm/${url}`, import.meta.url)).then(WebAssembly.compileStreaming),
    {
      ...wasip2,
      'wasi:cli/environment@0.2.0': {
        getEnvironment: () => ([]),
        getArguments: () => ["demo.wasm"],
        initialCwd: () => "/",
      },
    },
  );
  console.log(demo)
}

run()
