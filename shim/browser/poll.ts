import type { Pollable as WasiPollable } from '../../wasm/interfaces/wasi-io-poll.js';

// Global shared result map for operations
const operationResults = new Map();

// Extended Pollable that can store data for different types of events
export class Pollable implements WasiPollable {
  private type: string;
  private data: any;
  private operationId: number | null = null;
  private sharedBuffer: SharedArrayBuffer | null = null;

  constructor(type: string, data: any) {
    this.type = type;
    this.data = data;
  }

  public block(): void {
    console.log(`[pollable] blocking with type=${this.type}`);

    if (this.type === 'timer') {
      const { durationMs } = this.data;
      
      // Create a SharedArrayBuffer for this operation
      const sharedBuffer = new SharedArrayBuffer(4); // Int32Array needs 4 bytes
      const sharedArray = new Int32Array(sharedBuffer);
      
      // Initialize the value to 0 (not completed)
      Atomics.store(sharedArray, 0, 0);
      
      // Send a message to the main thread to handle this operation
      this.requestOperation(sharedBuffer, sharedArray);
      
      console.log(`[pollable] blocking thread for ${durationMs}ms using Atomics.wait`);
      
      // Block until the operation completes or times out
      const result = Atomics.wait(sharedArray, 0, 0, durationMs);
      
      console.log(`[pollable] Atomics.wait completed with result: ${result}`);
      
      // If we have any result data, we can process it here
      if (this.operationId !== null && operationResults.has(this.operationId)) {
        const result = operationResults.get(this.operationId);
        console.log(`[pollable] Operation result:`, result);
        operationResults.delete(this.operationId);
      }
    } else {
      console.warn(`[pollable] Unknown pollable type: ${this.type}, not blocking`);
    }
  }
  
  // Send a message to the main thread to handle the operation
  private requestOperation(sharedBuffer: SharedArrayBuffer, sharedArray: Int32Array): void {
    // Check if we're in a worker context
    if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
      // We're in a worker context, send a message to the main thread
      self.postMessage({
        type: 'operation-request',
        data: {
          operationType: this.type,
          operationId: Math.random(), // Simple unique ID
          params: {
            buffer: sharedBuffer,
            ...this.data
          }
        }
      });
    } else {
      console.error('[pollable] Not in a worker context, cannot request operation');
      
      // In case we're not in a worker, just set the value to 1 immediately
      // This will unblock immediately, which is not what we want but prevents hanging
      Atomics.store(sharedArray, 0, 1);
      Atomics.notify(sharedArray, 0);
    }
  }
}