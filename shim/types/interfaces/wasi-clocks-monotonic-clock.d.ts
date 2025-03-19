/** @module Interface wasi:clocks/monotonic-clock@0.2.0 **/
export function now(): Instant;
export type Instant = bigint;
