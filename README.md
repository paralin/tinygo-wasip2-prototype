# TinyGo WebAssembly with WASI Preview2

This repository contains a demonstration of running Go code in a browser using WebAssembly with WASI Preview2 support via TinyGo.

## Repository Contents

- **main.go**: A simple Go program that outputs a greeting message
- **build scripts**:
  - `build-go.bash`: Compiles the Go code to WebAssembly using TinyGo
  - `build-js.bash`: Transpiles the WASM module to JavaScript using JCO
  - `build-browser.bash`: Bundles and serves the web application
  - `serve.bash`: Main script that runs all build steps and serves the demo

- **Web files**:
  - `index.html`: Browser interface for the demo
  - `main.ts`: TypeScript code that loads and runs the WASM module

## Prerequisites

- TinyGo
- wasm-tools
- @bytecodealliance/jco (Node.js package)
- esbuild

## Running the Demo

To build and run the demo, simply execute:

```bash
./serve.bash
```

This will:
1. Compile the Go code to WebAssembly
2. Transpile the WASM module to JavaScript
3. Bundle the web application
4. Start a local server (typically on port 8000)

Open your browser to the displayed URL to see the demo in action.

## How It Works

This demo showcases how to bridge Go and WebAssembly with WASI Preview2, allowing Go code to run in browser environments with access to system interfaces like stdout through the WebAssembly System Interface standard.

The TypeScript code sets up the necessary WASI Preview2 interfaces (stdin, stdout, stderr, clocks, etc.) that the Go code expects, enabling seamless execution in the browser.


## Active Challenges

### Nonblocking I/O

When we call "time.Sleep" in Go this results in calling monotonic-clock
subscribeDuration which is currently stubbed in the wasip2 shim implementation
from bytecodealliance. Even worse, this depends on block() in Pollable.

Pollable is something from the host environment that the wasm code can wait for.
It has a single function block() which is supposed to block until the event
occurs, then return. The problem is that the JavaScript environment in the web
browser doesn't have blocking within a function call, it must return right away.
We can't block returning from block().

One option to fix this is to transform blocking I/O calls into async calls. jco
supports this experimentally with the `--async-mode jspi` (JavaScript Promise
Integration) flag. We then can set the poll function as async with
`--async-imports wasi:io/poll#[method]pollable.block` - then we get something
like `const trampoline0 = new WebAssembly.Suspending(async function(arg0) {`
with an `await pollable.block()` inside.

[The announcement for jspi] and [the jspi spec] describes how it is supposed to
work. The problem is: **WebAssembly.Suspending** is not implemented in Chrome or
Firefox as of 03/12/2025. It is currently in a [jspi origin trial] in Chrome,
ending in July 2025, so this is an extremely bleeding edge feature that is not
yet widely supported.

[The announcement for jspi]: https://v8.dev/blog/jspi
[the jspi spec]: https://github.com/WebAssembly/js-promise-integration/blob/main/proposals/js-promise-integration/Overview.md
[jspi origin trial]: https://developer.chrome.com/origintrials/#/view_trial/1603844417297317889
