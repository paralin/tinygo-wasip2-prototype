/**
 * JS Worker for handling JavaScript side of communication
 */

console.log('[worker-js] JS worker script started')

// Initialize the variables that will be set in the init message
let sharedBuffer: SharedArrayBuffer | null = null
let messagePort: MessagePort | null = null

// Set up message handler
self.onmessage = (event) => {
  const { sharedBuffer: buffer, port } = event.data

  if (buffer && port) {
    console.log('[worker-js] Received SharedArrayBuffer and MessagePort')
    sharedBuffer = buffer
    messagePort = port

    // Set up message listener on the port
    port.onmessage = handlePortMessage

    // Signal that we're ready
    self.postMessage({ type: 'js-ready' })
  }
}

/**
 * Handle messages from the WASM worker through the MessagePort
 */
function handlePortMessage(event: MessageEvent) {
  const { type, data } = event.data

  console.log(`[worker-js] Received message from WASM worker: ${type}`)

  if (type === 'wasm-ready') {
    console.log('[worker-js] WASM worker is ready')
  }

  // Here we would implement handlers for different message types
  // that the WASM worker might send us
}
