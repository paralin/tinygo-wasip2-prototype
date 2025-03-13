# Implementing Blocking I/O with Atomics.wait

## How Atomics.wait Works

The `Atomics.wait` approach allows a thread to block until a specific condition is met, providing a true synchronous blocking mechanism that maps well to Go's blocking operations. This is implemented using:

1. A `SharedArrayBuffer` accessible by both the main thread and a Web Worker
2. WebAssembly's atomic wait instructions that map to JavaScript's `Atomics.wait`
3. A coordination mechanism between threads for timing and waking

## Implementation Requirements

To implement this solution, we need:

- **Web Workers**: The WASM module must run in a Worker thread, as `Atomics.wait` cannot be used on the main thread
- **Security Headers**: The page must be served with proper COOP/COEP headers:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
- **SharedArrayBuffer**: Memory must be shared between threads

## Implemented Architecture

Our implementation uses a two-thread model:

1. **Main Thread**: 
   - Handles the UI and user interaction
   - Processes asynchronous operations requested by the worker
   - Notifies the worker when operations complete

2. **WASM Worker**: 
   - Runs the TinyGo WASM module
   - Implements WASI Preview2 interfaces
   - Uses Atomics.wait for synchronous blocking

The workflow for a blocking operation like `time.Sleep`:

1. The Go code calls `time.Sleep(duration)`
2. TinyGo's runtime calls WASI's `monotonic-clock.subscribeDuration(duration)`
3. Our implementation creates a Pollable object with timer data
4. The WASM runtime calls `pollable.block()` on that object
5. The worker creates a SharedArrayBuffer and sends it to the main thread
6. The worker blocks using `Atomics.wait` on the SharedArrayBuffer
7. The main thread handles the timer operation asynchronously
8. When the timer completes, the main thread updates the SharedArrayBuffer
9. The worker wakes up from `Atomics.wait` and continues execution

## Advantages and Considerations

This approach offers several benefits:

- **No Code Transformation**: Unlike Emscripten's Asyncify, this approach doesn't require code transformation
- **True Blocking**: Provides actual synchronous blocking from Go's perspective
- **UI Responsiveness**: The main thread remains responsive even during long-running operations
- **Standardized Interfaces**: Uses proper WASI Preview2 interfaces for future compatibility
- **Extensible**: The same architecture can support other blocking operations beyond timers

Considerations when using this approach:

- **Security Headers**: Requires proper COOP/COEP headers for SharedArrayBuffer support
- **Browser Support**: Requires browsers that support SharedArrayBuffer and Atomics
- **Complexity**: More complex setup with WebWorker and cross-thread communication
- **Debugging**: Debugging can be more challenging with multi-threaded execution

## Future Extensions

This architecture can be extended to support other blocking operations:

- Network I/O operations
- File system operations
- Inter-process communication
- Other blocking system calls

Each operation type would follow the same pattern of creating a Pollable, using SharedArrayBuffer with Atomics.wait, and having the main thread handle the asynchronous operation while the worker blocks synchronously.

