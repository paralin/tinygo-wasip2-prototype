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
console.log('[worker] Worker script started')

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
  // Construct the path to the WASM file
  const path = `/wasm/${url}`
  const resolvedUrl = new URL(path, self.location.href).href

  const response = await fetch(resolvedUrl)

  if (!response.ok) {
    throw new Error(`Failed to load WebAssembly module from ${path}`)
  }

  return WebAssembly.compileStreaming(response)
}

/**
 * Handle messages from the main thread
 */
self.onmessage = async (event) => {
  const { type } = event.data

  if (type === 'init') {
    try {
      // Initialize the environment
      initializeEnvironment()

      // Instantiate the WebAssembly module
      const wasmRoot = await (instantiate(
        fetchWasmModule,
        wasip2 as any, // the wasi code expects wasi:foo@bar but the types say wasi@v0.2.0... incorrrectly
      ) as unknown as Promise<Root>)

      // Tell the main thread we're ready
      self.postMessage({ type: 'ready' })

      // Run the WebAssembly module
      wasmRoot.run.run()
    } catch (error) {
      console.error('[worker] Failed to instantiate WebAssembly module:', error)
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

// Notify the main thread that the worker is initialized
self.postMessage({ type: 'initialized' })
