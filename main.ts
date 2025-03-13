// Declare updateStatus on window
declare global {
  interface Window {
    updateStatus: (message: string, type?: string) => void;
  }
}

// Global shared result map to store operation results
const operationResults = new Map();
let nextOperationId = 1;

// Create a shared array for communication between main thread and worker
const sharedArrays = new Map();

// Worker reference
let wasmWorker: Worker | null = null;

// Check if the browser supports required features
function checkBrowserSupport() {
  if (!window.crossOriginIsolated) {
    console.warn("WARNING: This page is not cross-origin isolated! SharedArrayBuffer and Atomics.wait may not work.");
    console.warn("Add these headers to your server:");
    console.warn("    Cross-Origin-Opener-Policy: same-origin");
    console.warn("    Cross-Origin-Embedder-Policy: require-corp");
    return false;
  }
  
  if (typeof SharedArrayBuffer === 'undefined') {
    console.error("SharedArrayBuffer is not supported in this browser");
    return false;
  }
  
  if (typeof Atomics === 'undefined') {
    console.error("Atomics API is not supported in this browser");
    return false;
  }
  
  return true;
}

// Create and initialize the WebWorker
function initWorker() {
  return new Promise<Worker>((resolve, reject) => {
    // Use absolute path to ensure correct loading
    const workerUrl = new URL('/dist/worker.js', window.location.origin).href;
    console.log(`[main] Loading worker from: ${workerUrl}`);
    const worker = new Worker(workerUrl, { type: 'module' });
    
    worker.onmessage = (event) => {
      const { type, data, error, id, result } = event.data;
      
      console.log('[main] Received message from worker:', type, data);
      
      if (type === 'initialized') {
        console.log('[main] Worker initialized');
        worker.postMessage({ type: 'init' });
      } else if (type === 'ready') {
        console.log('[main] Worker ready with WebAssembly module loaded');
        resolve(worker);
      } else if (type === 'error') {
        console.error('[main] Worker error:', error);
        reject(new Error(error));
      } else if (type === 'operation-result') {
        // Store operation result
        console.log(`[main] Storing operation result for ID ${id}:`, result);
        operationResults.set(id, result);
      } else if (type === 'operation-request') {
        // Handle operation requests from the worker
        console.log('[main] Received operation request:', data);
        handleOperationRequest(worker, data);
      } else {
        console.warn('[main] Unknown message type from worker:', type);
      }
    };
    
    worker.onerror = (error) => {
      console.error('[main] Worker initialization error:', error);
      reject(error);
    };
  });
}

// Handle various operation requests from the worker
async function handleOperationRequest(worker: Worker, data: any) {
  const { operationType, operationId, params } = data;
  
  if (!params.buffer) {
    console.error(`[main] No SharedArrayBuffer provided for operation ${operationId}`);
    return;
  }
  
  const sharedArray = new Int32Array(params.buffer);
  
  console.log(`[main] Handling operation request: type=${operationType}, id=${operationId}`, params);
  
  try {
    let result;
    
    if (operationType === 'timer') {
      // For timer operations, we just wait for the specified duration
      const { durationMs } = params;
      console.log(`[main] Starting timer operation for ${durationMs}ms`);
      
      // Record start time
      const startTime = Date.now();
      
      // Use setTimeout for the timer operation
      await new Promise(resolve => setTimeout(resolve, durationMs));
      
      const actualElapsed = Date.now() - startTime;
      result = { completed: true, timeElapsed: actualElapsed };
      
      console.log(`[main] Timer operation completed after ${actualElapsed}ms`);
    } else {
      console.warn(`[main] Unknown operation type: ${operationType}`);
      result = { error: `Unknown operation type: ${operationType}` };
    }
    
    // Store operation result
    operationResults.set(operationId, result);
    
    // Notify the worker that the operation is complete
    // IMPORTANT: We must set the value to 1 and THEN notify, not the other way around!
    console.log(`[main] Notifying worker that operation ${operationId} is complete`);
    
    // Set the value to 1 to indicate completion
    Atomics.store(sharedArray, 0, 1);
    
    // Then notify any waiting threads
    const notifyResult = Atomics.notify(sharedArray, 0);
    console.log(`[main] Notify result: ${notifyResult} waiters woken up`);
    
    // Also send a message to the worker with the result
    worker.postMessage({
      type: 'operation-complete',
      data: {
        operationId,
        buffer: params.buffer,
        index: 0,
        result
      }
    });
  } catch (error) {
    console.error(`[main] Error handling operation ${operationType}:`, error);
    
    // Store error result
    operationResults.set(operationId, { error: error.toString() });
    
    // Set the value to 1 to indicate completion (even though it's an error)
    Atomics.store(sharedArray, 0, 1);
    
    // Notify any waiting threads
    Atomics.notify(sharedArray, 0);
    
    // Also notify the worker of the error
    worker.postMessage({
      type: 'operation-complete',
      data: {
        operationId,
        buffer: params.buffer,
        index: 0,
        result: { error: error.toString() }
      }
    });
  }
}

// Create a new shared buffer for an operation
function createSharedBuffer() {
  const operationId = nextOperationId++;
  const sharedBuffer = new SharedArrayBuffer(4); // Int32Array needs 4 bytes
  const sharedArray = new Int32Array(sharedBuffer);
  
  // Initialize the value to 0 (not completed)
  Atomics.store(sharedArray, 0, 0);
  
  // Store the buffer for future reference
  sharedArrays.set(operationId, { buffer: sharedBuffer, array: sharedArray });
  
  return { operationId, buffer: sharedBuffer };
}

// Main function to initialize and run the application
async function run() {
  console.log("[main] Starting application");
  
  // Check if the browser supports required features
  if (!checkBrowserSupport()) {
    // Update the status to show the error
    if (typeof window.updateStatus === 'function') {
      window.updateStatus('Browser requirements not met. This application requires SharedArrayBuffer and Atomics, which are only available in secure contexts with cross-origin isolation. Please run the application using the provided server script: ./serve.bash', 'error');
    }
    return;
  }
  
  try {
    // Update status to initializing
    if (typeof window.updateStatus === 'function') {
      window.updateStatus('Initializing WebAssembly worker...', 'info');
    }
    
    // Initialize the worker
    wasmWorker = await initWorker();
    console.log("[main] WebAssembly application is now running in a worker");
    
    // Update status to success
    if (typeof window.updateStatus === 'function') {
      window.updateStatus('WebAssembly application is running in a Web Worker. Check the console for output.', 'success');
    }
  } catch (error) {
    console.error("[main] Failed to initialize:", error);
    
    // Update status to error
    if (typeof window.updateStatus === 'function') {
      window.updateStatus(`Failed to initialize: ${error.toString()}`, 'error');
    }
  }
}

// Start the application
run();