/**
 * Implementation of wasi:random/random@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'

/**
 * Maximum number of bytes that crypto.getRandomValues can handle at once
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 */
const MAX_BYTES_PER_CALL = 65536

/**
 * Get cryptographically secure random bytes
 * @param len Number of random bytes to generate
 * @returns Array of random bytes
 */
function getRandomBytes(len: bigint): Uint8Array {
  const byteLength = Number(len)
  const bytes = new Uint8Array(byteLength)

  if (byteLength > MAX_BYTES_PER_CALL) {
    // For large requests, we need to call getRandomValues multiple times
    // with chunks of MAX_BYTES_PER_CALL or less
    for (let offset = 0; offset < byteLength; offset += MAX_BYTES_PER_CALL) {
      const chunkSize = Math.min(MAX_BYTES_PER_CALL, byteLength - offset)
      crypto.getRandomValues(bytes.subarray(offset, offset + chunkSize))
    }
  } else {
    crypto.getRandomValues(bytes)
  }

  return bytes
}

/**
 * Get a cryptographically secure random 64-bit unsigned integer
 * @returns Random 64-bit unsigned integer
 */
function getRandomU64(): bigint {
  return crypto.getRandomValues(new BigUint64Array(1))[0]
}

export const random = {
  getRandomBytes,
  getRandomU64,
}
