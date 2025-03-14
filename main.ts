// Declare updateStatus on window
declare global {
  interface Window {
    updateStatus: (message: string, type?: string) => void
  }
}

// Worker reference
let wasmWorker: Worker | null = null

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

// Create and initialize the WebWorker
function initWorker() {
  return new Promise<Worker>((resolve, reject) => {
    // Use absolute path to ensure correct loading
    const workerUrl = new URL('/dist/worker.js', window.location.origin).href
    console.log(`[main] Loading worker from: ${workerUrl}`)
    const worker = new Worker(workerUrl, { type: 'module' })

    worker.onmessage = (event) => {
      const { type, error } = event.data

      console.log('[main] Received message from worker:', type)

      if (type === 'initialized') {
        console.log('[main] Worker initialized')
        worker.postMessage({ type: 'init' })
      } else if (type === 'ready') {
        console.log('[main] Worker ready with WebAssembly module loaded')
        resolve(worker)
      } else if (type === 'error') {
        console.error('[main] Worker error:', error)
        reject(new Error(error))
      } else {
        console.log('[main] Message from worker:', event.data)
      }
    }

    worker.onerror = (error) => {
      console.error('[main] Worker initialization error:', error)
      reject(error)
    }
  })
}

// Main function to initialize and run the application
async function run() {
  console.log('[main] Starting application')

  // Check if the browser supports required features
  if (!checkBrowserSupport()) {
    // Update the status to show the error
    if (typeof window.updateStatus === 'function') {
      window.updateStatus(
        'Browser requirements not met. This application requires SharedArrayBuffer and Atomics, which are only available in secure contexts with cross-origin isolation. Please run the application using the provided server script: ./serve.bash',
        'error',
      )
    }
    return
  }

  try {
    // Update status to initializing
    if (typeof window.updateStatus === 'function') {
      window.updateStatus('Initializing WebAssembly worker...', 'info')
    }

    // Initialize the worker
    wasmWorker = await initWorker()
    console.log('[main] WebAssembly application is now running in a worker')

    // Update status to success
    if (typeof window.updateStatus === 'function') {
      window.updateStatus(
        'WebAssembly application is running in a Web Worker. Check the console for output.',
        'success',
      )
    }
  } catch (error) {
    console.error('[main] Failed to initialize:', error)

    // Update status to error
    if (typeof window.updateStatus === 'function') {
      window.updateStatus(`Failed to initialize: ${error.toString()}`, 'error')
    }
  }
}

// Start the application
run()
