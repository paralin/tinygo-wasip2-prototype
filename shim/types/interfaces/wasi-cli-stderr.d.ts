/** @module Interface wasi:cli/stderr@0.2.0 **/
export function getStderr(): OutputStream
export type OutputStream = import('./wasi-io-streams.js').OutputStream
