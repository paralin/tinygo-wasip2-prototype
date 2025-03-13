import type { Pollable as WasiPollable } from '../../wasm/interfaces/wasi-io-poll.js';

// Global dummy SharedArrayBuffer for Atomics.wait operations
const globalSharedBuffer = new SharedArrayBuffer(4);
const globalSharedArray = new Int32Array(globalSharedBuffer);

// Initialize the value to 0
Atomics.store(globalSharedArray, 0, 0);

// Extended Pollable that can store data for different types of events
export class Pollable implements WasiPollable {
  private type: string;
  private data: any;

  constructor(type: string, data: any) {
    this.type = type;
    this.data = data;
  }

  public block(): void {
    console.log(`[pollable] blocking with type=${this.type}`);

    if (this.type === 'timer') {
      const { durationMs } = this.data;
      
      // Record start time for accurate logging
      const startTime = Date.now();
      
      console.log(`[pollable] blocking thread for ${durationMs}ms using Atomics.wait`);
      
      // Simply use Atomics.wait with the duration as timeout
      // This will always time out after the specified duration
      const result = Atomics.wait(globalSharedArray, 0, 0, durationMs);
      
      const elapsedMs = Date.now() - startTime;
      console.log(`[pollable] Atomics.wait completed with result: ${result}, blocked for ${elapsedMs}ms`);
      
      // Atomics.wait should return 'timed-out' since we're using it as a sleep mechanism
      if (result !== 'timed-out') {
        console.warn(`[pollable] Unexpected Atomics.wait result: ${result}, expected 'timed-out'`);
      }
    } else {
      console.warn(`[pollable] Unknown pollable type: ${this.type}, not blocking`);
    }
  }
}