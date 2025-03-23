// Worker references
let wasmWorker: Worker | null = null
let jsWorker: Worker | null = null

// Check if the browser supports required features
function checkBrowserSupport() {
  if (!window.crossOriginIsolated) {
    console.warn(
      'WARNING: This page is not cross-origin isolated! SharedArrayBuffer and Atomics.wait may not work.',
    )
    console.warn('Add these headers to your server:')
    console.warn('    Cross-Origin-Opener-Policy: same-origin')
    console.warn('    Cross-Origin-Embedder-Policy: require-corp')
    return false
  }

  if (typeof SharedArrayBuffer === 'undefined') {
    console.error('SharedArrayBuffer is not supported in this browser')
    return false
  }

  if (typeof Atomics === 'undefined') {
    console.error('Atomics API is not supported in this browser')
    return false
  }

  return true
}

// Create and initialize the WebWorkers
async function initWorkers() {
  // Create a SharedArrayBuffer for communication between workers
  const sharedBuffer = new SharedArrayBuffer(1024 * 1024) // 1MB buffer

  // Create a MessageChannel for communication
  const channel = new MessageChannel()

  // Return promise that resolves when both workers are ready
  return new Promise<{ wasmWorker: Worker; jsWorker: Worker }>(
    (resolve, reject) => {
      let wasmWorkerReady = false
      let jsWorkerReady = false

      // Initialize WASM worker
      const wasmWorkerUrl = new URL(
        '/dist/worker-wasm.js',
        window.location.origin,
      ).href
      console.log(`[main] Loading WASM worker from: ${wasmWorkerUrl}`)
      const wasmWorker = new Worker(wasmWorkerUrl, { type: 'module' })

      // Initialize JS worker
      const jsWorkerUrl = new URL('/dist/worker-js.js', window.location.origin)
        .href
      console.log(`[main] Loading JS worker from: ${jsWorkerUrl}`)
      const jsWorker = new Worker(jsWorkerUrl, { type: 'module' })

      // Handle messages from WASM worker
      wasmWorker.onmessage = (event) => {
        const { type } = event.data
        console.log('[main] Received message from WASM worker:', type)

        if (type === 'ready') {
          console.log('[main] WASM worker ready with WebAssembly module loaded')
          wasmWorkerReady = true
          if (jsWorkerReady) {
            resolve({ wasmWorker, jsWorker })
          }
        } else if (type === 'error') {
          console.error('[main] WASM worker error:', event.data.error)
          reject(new Error(event.data.error))
        }
      }

      // Handle messages from JS worker
      jsWorker.onmessage = (event) => {
        const { type } = event.data
        console.log('[main] Received message from JS worker:', type)

        if (type === 'js-ready') {
          console.log('[main] JS worker ready')
          jsWorkerReady = true
          if (wasmWorkerReady) {
            resolve({ wasmWorker, jsWorker })
          }
        } else if (type === 'error') {
          console.error('[main] JS worker error:', event.data.error)
          reject(new Error(event.data.error))
        }
      }

      // Handle errors
      wasmWorker.onerror = (error) => {
        console.error('[main] WASM worker initialization error:', error)
        reject(error)
      }

      jsWorker.onerror = (error) => {
        console.error('[main] JS worker initialization error:', error)
        reject(error)
      }

      // Send initialization data to workers immediately
      console.log('[main] Sending initialization data to workers')
      wasmWorker.postMessage({ sharedBuffer, port: channel.port2 }, [
        channel.port2,
      ])

      jsWorker.postMessage({ sharedBuffer, port: channel.port1 }, [
        channel.port1,
      ])
    },
  )
}

// Main function to initialize and run the application
async function run() {
  console.log('[main] Starting application')

  // Check if the browser supports required features
  if (!checkBrowserSupport()) {
    return
  }

  try {
    // Initialize the workers
    const workers = await initWorkers()
    wasmWorker = workers.wasmWorker
    jsWorker = workers.jsWorker

    console.log('[main] Both workers initialized and connected')
  } catch (error) {
    console.error('[main] Failed to initialize:', error)
  }
}

// Start the application
run()
