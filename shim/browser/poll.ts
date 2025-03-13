import type { Pollable } from '../wasm/interfaces/wasi-io-poll.js'

// Pollable shim
export class PollableShim implements Pollable {
  public block() {
    console.log('pollable shim block')
  }
}
