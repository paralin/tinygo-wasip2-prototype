# TinyGo WebAssembly with WASI Preview2

This repository contains a demonstration of running Go code in a browser using WebAssembly with WASI Preview2 support via TinyGo.

As far as I can tell, what I want to do (implement the stdlib with async functions) would require modifying Tinygo. Currently a goroutine unwinds back to the scheduler by calling task.Pause(), which invokes tinygo_unwind and uses asyncify to return control to the scheduler but not to JavaScript. The scheduler then continues running other goroutines without ever returning control to the JavaScript environment. This means any Promises created during WebAssembly execution would never have a chance to resolve, as the JavaScript event loop can't process them while WebAssembly has control.

To properly support async JavaScript functions, we would need to modify this behavior so that when an async function is called, the goroutine unwinds all the way back to JavaScript (not just to the scheduler), allowing the JavaScript event loop to run and process the Promise. Then we would need to call run() again to resume the scheduler.

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

### Importing Wasi Functions

Tinygo uses this construct internally to import functions from the "imports" structure:

```go
//go:wasmimport wasi:io/poll@0.2.0 [method]pollable.ready
//go:noescape
func wasmimport_PollableReady(self0 uint32) (result0 uint32)
```

## Asynchronous I/O

We use Atomics.wait to block the javascript thread while waiting for a duration to implement Pollable.block() with scheduleDuration for time.After and time.Sleep.

- **WebWorker**: The WASM module runs in a dedicated WebWorker thread, leaving the main thread responsive
- **WASI Preview2**: We've implemented the missing parts of the WASI Preview2 interfaces for clocks and polling
- **Synchronous Blocking**: Uses SharedArrayBuffer and Atomics.wait to block the thread synchronously w/ a timeout
- **Cross-origin Isolation**: The server is configured with required COOP/COEP headers for SharedArrayBuffer support

This implementation allows standard Go code using `time.Sleep` to work without modification by implementing the underlying WASI interfaces that TinyGo uses.

### Implementation Flow

1. Main thread creates a WebWorker and initializes it
2. WebWorker loads and runs the WASM module
3. Go code in WASM calls `time.Sleep(duration)`
4. TinyGo runtime calls WASI's `monotonic-clock.subscribeDuration(duration)`
5. Our shim returns a Pollable object
6. TinyGo runtime calls `pollable.block()` on that object
7. The Pollable's block method uses Atomics.wait with a timeout set to the desired duration
8. The worker thread blocks synchronously until Atomics.wait times out after the specified duration
9. Execution continues after the timeout

### Nonblocking I/O

This section describes the challenges we aim to address in this implementation.

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
yet widely supported. See [jspi proposal] for more details.

[The announcement for jspi]: https://v8.dev/blog/jspi
[the jspi spec]: https://github.com/WebAssembly/js-promise-integration/blob/main/proposals/js-promise-integration/Overview.md
[jspi origin trial]: https://developer.chrome.com/origintrials/#/view_trial/1603844417297317889
[jspi proposal]: https://github.com/WebAssembly/js-promise-integration

The latest update on jspi can be found in the [extent to extend experiment]
email on the Blink mailing list in which, as of January 29, 2025:

> SPI has been inherently hard to specify, and validate security requirements
> for given that it is somewhat sandwiched between JS & Wasm. Concretely, since
> the last OT extension, the late breaking changes have been merged into the
> specification and we've gotten more signals about the exploitable security
> surface of JSPI (OT features are treated as shipped features for V8), and we'd
> like to focus on hardening security ahead of an intent to ship.
>
> ~ Deepti Gandluri

[extent to extend experiment]: https://groups.google.com/a/chromium.org/g/blink-dev/c/ke9rpIdSTwI/m/pq9PnNtCAAAJ

Since jspi is not yet supported and there's apparently no way to return
asynchronously from a call from wasm => javascript I guess the only way to make
this work is to force all the calls out of Go to be synchronous in nature and
handle the async with a callback calling into the Go runtime from outside of
wasm when the promise resolves.

### Blocking I/O

There is a way to block JavaScript in the web browser; we can use [Atomics.wait]
with a SharedArrayBuffer to block the JS thread. This is supported in all major
browsers but requires [secure context] and [cross-origin isolated] headers. This
would require two coopoerating Worker where one Worker sets up the JavaScript
async Promise callbacks and the other (wasm) uses Atomics.wait to block the wasm
function call until the Promise resolves.

[Atomics.wait]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait
[SharedArrayBuffer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
[secure context]: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
[cross-origin isolated]: https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated

### Asynchronous I/O With Asyncify

TinyGo already uses [Asyncify] from Binaryen to implement Goroutines.

[Asyncify]: https://github.com/WebAssembly/binaryen/blob/main/src/passes/Asyncify.cpp

TinyGo uses the asyncify scheduler implementation to enable goroutines to be
properly suspended and resumed in WebAssembly environments, particularly for
handling async functions imported with `//go:wasmimport`.

- TinyGo uses Binaryen's wasm-opt tool with the `--asyncify` flag to transform WebAssembly code.
- Goroutines are represented as Task w/ a Stack within the tinygo source code (the Go runtime).
- When a goroutine needs to wait, it's unwound using the asyncify mechanism

The key tinygo source files are:

- `task_asyncify.go`: implementation of Task calling the Asyncify functions
- `task_asyncify_wasm.S`: WebAssembly-specific assembly code for stack manipulation
- `scheduler_cooperative.go`: cooperative scheduler that manages Goroutine as Task

When the tinygo program starts, we call `run` which is defined in scheduler_cooporative.go.

```go
// run is called by the program entry point to execute the go program.
// With a scheduler, init and the main function are invoked in a goroutine before starting the scheduler.
func run() {
	initHeap()
	initRand()
	go func() {
		initAll()
		callMain()
		mainExited = true
	}()
	scheduler(false)
}
```

This creates a new Goroutine to call `init()` and `main()` which is initially sleeping.

The `scheduler` has the following general loop, while the program has not exited:

- Add Task that are done sleeping to the end of the runqueue.
- Run the callback for any timers that have ticked.
- Pop the next Task from the runqueue.
  - If there is no queued Task: sleep until the next sleepQueue or timerQueue entry is ready.
  - Otherwise return with an error saying we are deadlocked.
- Call Resume on the Task.

When a goroutine needs to yield control (e.g., mutex lock, channel operation, sleep) it calls `Task.Pause()`:
1. Check for stack overflow by verifying the stack canary value.
2. Call `currentTask.state.unwind()` which invokes `tinygo_unwind` in assembly
3. `tinygo_unwind` performs these steps:
   - Checks if already in rewinding mode:
     - If yes, calls `stop_rewind` and clears the flag
   - If not in rewinding mode:
     - Saves the current stack pointer to `state.csp`
     - Calls `asyncify.start_unwind(state)`
     - This triggers the asyncify transformation to unwind the entire stack
     - Control returns to the scheduler without executing the rest of the goroutine

When the scheduler decides to run a goroutine (represented as a Task), it calls `Task.Resume()`:

1. If the task has never run before (`!t.state.launched`):
   - Calls `t.state.launch()` which invokes `tinygo_launch` in assembly
   - `tinygo_launch` performs these steps:
     - Switches to the goroutine's stack by setting `__stack_pointer`
     - Retrieves the entry function and arguments from task state
     - Calls the entry function with arguments
     - Calls `stop_unwind` to ensure normal execution mode
     - Restores the original stack pointer
   - Sets `t.state.launched = true` to indicate this task has started

2. If the task has run before and was suspended:
   - Calls `t.state.rewind()` which invokes `tinygo_rewind` in assembly
   - `tinygo_rewind` performs these steps:
     - Switches to the goroutine's stack
     - Retrieves the entry function and arguments
     - Sets `tinygo_rewinding = true` to indicate we're in rewind mode
     - Calls `asyncify.start_rewind` with the stack state
     - Calls the entry function, which (due to asyncify's transformation) will jump directly to where the task was previously suspended
     - Calls `stop_unwind` when the task suspends again or completes
     - Restores the original stack pointer

When we call `start_unwind` in `task.Pause` the function call in `tinygo_rewind`
returns, and we then call `stop_unwind` to finish the unwind operation, and
return back to the scheduler, returning from `task.Resume`.
