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
      
      // Use a larger timeout to ensure we block properly - we'll rely on the main thread notification
      const waitTimeoutMs = durationMs * 2;
      
      // Create a SharedArrayBuffer for this operation
      const sharedBuffer = new SharedArrayBuffer(4); // Int32Array needs 4 bytes
      const sharedArray = new Int32Array(sharedBuffer);
      
      // Initialize the value to 0 (not completed)
      Atomics.store(sharedArray, 0, 0);
      
      // Record start time for accurate logging
      const startTime = Date.now();
      
      // Send a message to the main thread to handle this operation
      this.requestOperation(sharedBuffer, sharedArray);
      
      console.log(`[pollable] blocking thread for ${durationMs}ms using Atomics.wait`);
      
      // Block until notified by the main thread (we rely on notification, not timeout)
      // We use a longer timeout as a safety measure
      const result = Atomics.wait(sharedArray, 0, 0, waitTimeoutMs);
      
      const elapsedMs = Date.now() - startTime;
      console.log(`[pollable] Atomics.wait completed with result: ${result}, blocked for ${elapsedMs}ms`);
      
      // If there was no notification, something went wrong
      if (result === 'timed-out' && elapsedMs < durationMs * 0.9) {
        console.error(`[pollable] Timer operation failed: blocked for only ${elapsedMs}ms out of ${durationMs}ms`);
      }
      
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
      // Generate a unique ID for this operation
      this.operationId = Date.now() + Math.random();
      
      console.log(`[pollable] Requesting operation ${this.type} with ID ${this.operationId}`);
      
      // We're in a worker context, send a message to the main thread
      self.postMessage({
        type: 'operation-request',
        data: {
          operationType: this.type,
          operationId: this.operationId,
          params: {
            buffer: sharedBuffer,
            ...this.data
          }
        }
      });
      
      // Verify that the message was sent
      console.log(`[pollable] Operation request sent to main thread`);
    } else {
      console.error('[pollable] Not in a worker context, cannot request operation');
      
      // In case we're not in a worker, just set the value to 1 immediately
      // This will unblock immediately, which is not what we want but prevents hanging
      Atomics.store(sharedArray, 0, 1);
      Atomics.notify(sharedArray, 0);
    }
  }
}