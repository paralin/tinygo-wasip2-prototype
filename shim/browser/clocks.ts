// This file was initially based on:
// https://github.com/bytecodealliance/jco/blob/8ed4096/packages/preview2-shim/lib/browser/clocks.js
// Apache-2.0 license

import { Pollable} from './poll.js';

export const monotonicClock = {
  resolution() {
    // usually we dont get sub-millisecond accuracy in the browser
    // Note: is there a better way to determine this?
    return 1e6;
  },
  
  now() {
    // performance.now() is in milliseconds, but we want nanoseconds
    return BigInt(Math.floor(performance.now() * 1e6));
  },
  
  subscribeInstant(instant) {
    instant = BigInt(instant);
    const now = this.now();
    if (instant <= now)
      return this.subscribeDuration(0n);
    return this.subscribeDuration(instant - now);
  },
  
  subscribeDuration(duration) {
    // Convert nanoseconds to milliseconds
    const durationMs = Number(BigInt(duration) / BigInt(1_000_000));
    console.log(`[monotonic-clock] subscribeDuration called with ${durationMs}ms`);

    // Create a Pollable that will block for the specified duration
    return new Pollable('timer', { durationMs });
  }
};

export const wallClock = {
  now() {
    let now = Date.now(); // in milliseconds
    const seconds = BigInt(Math.floor(now / 1e3));
    const nanoseconds = (now % 1e3) * 1e6;
    return { seconds, nanoseconds };
  },
  
  resolution() {
    return { seconds: 0n, nanoseconds: 1e6 };
  }
};
