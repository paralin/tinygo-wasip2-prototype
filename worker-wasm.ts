/**
 * Worker for running WebAssembly in a separate thread
 */

import { instantiate, Root } from './wasm/main.js'
import { wasip2 } from './shim/browser/index.js'
import {
  setCommandLineArgs,
  setEnvironmentVariables,
} from './shim/browser/cli/environment.js'
import { initializeFileSystem } from './shim/browser/filesystem/preopens.js'

// Log that the worker is starting
console.log('[worker-wasm] WebAssembly worker script started')

/**
 * Initialize the environment with default values
 */
function initializeEnvironment(): void {
  // Set default environment variables
  setEnvironmentVariables({
    LANG: 'en_US.UTF-8',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOME: '/home/user',
  })

  // Set command line arguments
  setCommandLineArgs(['wasm-app'])

  // Initialize filesystem with a minimal structure
  const initialFs = {
    dir: {
      home: {
        dir: {
          user: { dir: {} },
        },
      },
      tmp: { dir: {} },
    },
  }

  initializeFileSystem(initialFs)
}

/**
 * Fetch and compile a WebAssembly module
 */
async function fetchWasmModule(url: string): Promise<WebAssembly.Module> {
  try {
    const path: string = `./wasm/${url}`

    console.log(`[worker-wasm] Fetching WebAssembly module from ${path}`)
    const resolvedUrl = new URL(path, self.location.href).href

    const response = await fetch(resolvedUrl)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      )
    }

    return await WebAssembly.compileStreaming(response)
  } catch (error) {
    console.error(`[worker-wasm] Error fetching/compiling ${url}:`, error)
    throw error // Re-throw to propagate the error
  }
}

// Start pre-compiling all WebAssembly modules needed for the component
const moduleFiles = [
  'main.core.wasm',
  'main.core2.wasm',
  'main.core3.wasm',
  'main.core4.wasm',
]

// Create a map to store module promises
const moduleCache = new Map<string, Promise<WebAssembly.Module>>()

// Start fetching and compiling all modules immediately
console.log('[worker-wasm] Pre-compiling all WebAssembly modules')
for (const moduleFile of moduleFiles) {
  const modulePromise = fetchWasmModule(moduleFile).catch((error) => {
    console.error(`[worker-wasm] Error pre-compiling ${moduleFile}:`, error)
    // Re-throw to maintain Promise rejection chain
    throw error
  })
  moduleCache.set(moduleFile, modulePromise)
}

const fetchCompileWasm = (filename: string) => {
  console.log(`[worker-wasm] Requested module: ${filename}`)

  // Check if we have this module in the cache
  const cachedModule = moduleCache.get(filename)
  if (cachedModule) {
    return cachedModule
  }

  // If not in cache (unlikely but possible), fetch it now
  console.log(`[worker-wasm] Module not pre-cached, fetching: ${filename}`)
  try {
    const modulePromise = fetchWasmModule(filename).catch((error) => {
      console.error(
        `[worker-wasm] Error loading module on demand ${filename}:`,
        error,
      )
      // Report to the console but still propagate the error
      throw error
    })
    moduleCache.set(filename, modulePromise)
    return modulePromise
  } catch (error) {
    console.error(
      `[worker-wasm] Unexpected error in fetchCompileWasm for ${filename}:`,
      error,
    )
    throw error
  }
}

// Create a promise that will resolve when initialization is complete
const initPromise = new Promise<{
  sharedBuffer: SharedArrayBuffer
  port: MessagePort
}>((resolve) => {
  self.onmessage = (event: MessageEvent) => {
    const { sharedBuffer, port } = event.data

    if (sharedBuffer && port) {
      console.log('[worker-wasm] Received SharedArrayBuffer and MessagePort')
      resolve({ sharedBuffer, port })
    }
  }
})

// Wait for initialization parameters
initPromise
  .then(async ({ sharedBuffer, port }) => {
    try {
      console.log('[worker-wasm] Received init')

      // Initialize the environment
      initializeEnvironment()

      // Instantiate the WebAssembly module with a function that returns from cache
      const wasmRoot = await (instantiate(
        fetchCompileWasm,
        wasip2 as any, // the wasi code expects wasi:foo@bar but the types say wasi@v0.2.0... incorrectly
      ) as unknown as Promise<Root>)

      console.log('[worker-wasm] WebAssembly module instantiated successfully')

      // Tell the JS worker we're ready using the MessagePort
      port.postMessage({ type: 'wasm-ready' })

      // Run the WebAssembly module
      wasmRoot.run.run()
    } catch (error) {
      console.error('[worker-wasm] Failed to run WebAssembly module:', error)
      port.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })
  .catch((error) => {
    console.error('[worker-wasm] Error during initialization:', error)
  })
