import { instantiate, Root } from "../../wasm/main.js";
import { wasip2 } from "./index.js";

// Log that the worker is starting
console.log('[worker] Worker script started');

// Message handler for receiving commands from the main thread
self.onmessage = async (event) => {
  console.log('[worker] Received message:', event.data);
  const { type } = event.data;
  
  if (type === 'init') {
    try {
      console.log("[worker] Initializing WebAssembly module");
      
      // Define a getBinaryURL function for the worker
      const getBinaryURL = async (url: string) => {
        // In the worker context, the paths are relative to the worker.js location
        // We need to adjust the path to find the wasm files
        
        // Construct the path to the WASM file
        const path = `/wasm/${url}`;
        const resolvedUrl = new URL(path, self.location.href).href;
        
        console.log(`[worker] Trying to fetch WASM from: ${resolvedUrl}`);
        const source = await fetch(resolvedUrl);
        
        if (!source.ok) {
          console.log(`[worker] Failed to fetch from ${path}`);
          throw new Error(`Failed to load WebAssembly module from ${path}`);
        }
        
        console.log(`[worker] Successfully loaded WASM from: ${resolvedUrl}`);
        
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
  }
};

// Notify the main thread that the worker is initialized
self.postMessage({ type: 'initialized' });
