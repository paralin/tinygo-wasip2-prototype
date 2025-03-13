import { instantiate, Root } from "../../wasm/main.js";
import { wasip2 } from "./index.js";

// Log that the worker is starting
console.log('[worker] Worker script started');

// Message handler for receiving commands from the main thread
self.onmessage = async (event) => {
  console.log('[worker] Received message:', event.data);
  const { type, data } = event.data;
  
  if (type === 'init') {
    try {
      console.log("[worker] Initializing WebAssembly module");
      
      // Define a getBinaryURL function for the worker
      const getBinaryURL = async (url: string) => {
        // In the worker context, the paths are relative to the worker.js location
        // We need to adjust the path to find the wasm files
        
        // Try different paths to find the WASM file
        const possiblePaths = [
          `/wasm/${url}`,
          `/dist/wasm/${url}`,
          `../wasm/${url}`,
          `../../wasm/${url}`
        ];
        
        let source;
        for (const path of possiblePaths) {
          try {
            const resolvedUrl = new URL(path, self.location.href).href;
            console.log(`[worker] Trying to fetch WASM from: ${resolvedUrl}`);
            source = await fetch(resolvedUrl);
            if (source.ok) {
              console.log(`[worker] Successfully loaded WASM from: ${resolvedUrl}`);
              break;
            }
          } catch (e) {
            console.log(`[worker] Failed to fetch from ${path}:`, e);
          }
        }
        
        if (!source || !source.ok) {
          throw new Error(`Failed to load WebAssembly module from any path`);
        }
        
        return WebAssembly.compileStreaming(source);
      };
      
      // Instantiate the WebAssembly module
      const demo = await (instantiate(getBinaryURL, wasip2 as any) as unknown as Promise<Root>);
      console.log("[worker] WebAssembly module instantiated successfully");
      
      // Tell the main thread we're ready
      self.postMessage({ type: 'ready' });
      
      // Run the WebAssembly module
      demo.run.run();
    } catch (error) {
      console.error("[worker] Failed to instantiate WebAssembly module:", error);
      self.postMessage({ type: 'error', error: error.toString() });
    }
  } else if (type === 'operation-complete') {
    // When an operation is complete, notify the waiting Atomics
    const { buffer, index, result } = data;
    const sharedArray = new Int32Array(buffer);
    
    // Store any result data in a global map that can be retrieved after waking up
    if (result !== undefined) {
      // The worker can store results for different operations
      self.postMessage({ type: 'operation-result', id: index, result });
    }
    
    // Set the value to 1 and notify any waiting threads
    Atomics.store(sharedArray, index, 1);
    Atomics.notify(sharedArray, index);
    
    console.log(`[worker] Notified waiting thread for operation at index ${index}`);
  }
};

// Initialize global SharedArrayBuffer for temporary operations
// This ensures it's available in the global scope for the Pollable.block method
(self as any).sharedArray = new Int32Array(new SharedArrayBuffer(4));

// Notify the main thread that the worker is initialized
self.postMessage({ type: 'initialized' });