/**
 * WASI Preview2 Browser Shim Implementation
 *
 * This module exports all WASI Preview2 interfaces implemented for browser environments.
 * Each interface is implemented according to the specifications defined in wasm/interfaces/
 */

import { monotonicClock } from './clocks/monotonic-clock.js'
import { wallClock } from './clocks/wall-clock.js'
import { poll } from './io/poll.js'
import { environment, stderr, stdin, stdout } from './cli/index.js'
import { preopens, types } from './filesystem/index.js'
import { Descriptor, DirectoryEntryStream } from './filesystem/types.js'
import { error, streams } from './io/index.js'
import { random } from './random/index.js'
import type * as wasip2Types from '../types/index.js'

/**
 * Type definition for the WASI Preview2 interfaces
 */
type WASIP2 = {
  'wasi:cli/environment': typeof wasip2Types.cli.environment
  'wasi:cli/stderr': typeof wasip2Types.cli.stderr
  'wasi:cli/stdin': typeof wasip2Types.cli.stdin
  'wasi:cli/stdout': typeof wasip2Types.cli.stdout
  'wasi:filesystem/preopens': typeof wasip2Types.filesystem.preopens
  'wasi:filesystem/types': typeof wasip2Types.filesystem.types
  'wasi:io/error': typeof wasip2Types.io.error
  'wasi:io/streams': typeof wasip2Types.io.streams
  'wasi:random/random': typeof wasip2Types.random.random
  'wasi:io/poll': typeof wasip2Types.io.poll
  'wasi:clocks/monotonic-clock': typeof wasip2Types.clocks.monotonicClock
  'wasi:clocks/wall-clock': typeof wasip2Types.clocks.wallClock
}

/**
 * Define adapter classes for each class to make them compatible with the expected interface
 */
// Adapter for Pollable class
class PollableAdapter implements wasip2Types.io.poll.Pollable {
  private instance: typeof poll.Pollable.prototype

  constructor() {
    this.instance = poll.Pollable.create()
  }

  block(): void {
    this.instance.block()
  }

  ready(): boolean {
    return this.instance.ready()
  }
}

// Adapter for DirectoryEntryStream class
class DirectoryEntryStreamAdapter
  implements wasip2Types.filesystem.types.DirectoryEntryStream
{
  private instance: ReturnType<typeof DirectoryEntryStream.create>

  constructor() {
    this.instance = DirectoryEntryStream.create()
  }

  readDirectoryEntry():
    | wasip2Types.filesystem.types.DirectoryEntry
    | undefined {
    return this.instance.readDirectoryEntry()
  }
}

// Adapter for Descriptor class
class DescriptorAdapter implements wasip2Types.filesystem.types.Descriptor {
  private instance: ReturnType<typeof Descriptor.create>

  constructor() {
    this.instance = Descriptor.create()
  }

  syncData(): void {
    return this.instance.syncData()
  }

  read(
    length: wasip2Types.filesystem.types.Filesize,
    offset: wasip2Types.filesystem.types.Filesize,
  ): [Uint8Array, boolean] {
    return this.instance.read(length, offset)
  }

  write(
    buffer: Uint8Array,
    offset: wasip2Types.filesystem.types.Filesize,
  ): wasip2Types.filesystem.types.Filesize {
    return this.instance.write(buffer, offset)
  }

  readDirectory(): wasip2Types.filesystem.types.DirectoryEntryStream {
    return this.instance.readDirectory()
  }

  createDirectoryAt(path: string): void {
    return this.instance.createDirectoryAt(path)
  }

  stat(): wasip2Types.filesystem.types.DescriptorStat {
    return this.instance.stat()
  }

  statAt(
    pathFlags: wasip2Types.filesystem.types.PathFlags,
    path: string,
  ): wasip2Types.filesystem.types.DescriptorStat {
    return this.instance.statAt(pathFlags, path)
  }

  linkAt(
    oldPathFlags: wasip2Types.filesystem.types.PathFlags,
    oldPath: string,
    newDescriptor: wasip2Types.filesystem.types.Descriptor,
    newPath: string,
  ): void {
    return this.instance.linkAt(oldPathFlags, oldPath, newDescriptor, newPath)
  }

  openAt(
    pathFlags: wasip2Types.filesystem.types.PathFlags,
    path: string,
    openFlags: wasip2Types.filesystem.types.OpenFlags,
    flags: wasip2Types.filesystem.types.DescriptorFlags,
  ): wasip2Types.filesystem.types.Descriptor {
    return this.instance.openAt(pathFlags, path, openFlags, flags)
  }

  readlinkAt(path: string): string {
    return this.instance.readlinkAt(path)
  }

  removeDirectoryAt(path: string): void {
    return this.instance.removeDirectoryAt(path)
  }

  renameAt(
    oldPath: string,
    newDescriptor: wasip2Types.filesystem.types.Descriptor,
    newPath: string,
  ): void {
    return this.instance.renameAt(oldPath, newDescriptor, newPath)
  }

  symlinkAt(oldPath: string, newPath: string): void {
    return this.instance.symlinkAt(oldPath, newPath)
  }

  unlinkFileAt(path: string): void {
    return this.instance.unlinkFileAt(path)
  }

  readViaStream(
    offset: wasip2Types.filesystem.types.Filesize,
  ): wasip2Types.io.streams.InputStream {
    return this.instance.readViaStream(offset)
  }

  writeViaStream(
    offset: wasip2Types.filesystem.types.Filesize,
  ): wasip2Types.io.streams.OutputStream {
    return this.instance.writeViaStream(offset)
  }

  appendViaStream(): wasip2Types.io.streams.OutputStream {
    return this.instance.appendViaStream()
  }

  advise(
    offset: wasip2Types.filesystem.types.Filesize,
    length: wasip2Types.filesystem.types.Filesize,
    advice: wasip2Types.filesystem.types.Advice,
  ): void {
    return this.instance.advise(offset, length, advice)
  }

  sync(): void {
    return this.instance.sync()
  }

  setFlags(flags: wasip2Types.filesystem.types.DescriptorFlags): void {
    return this.instance.setFlags(flags)
  }

  getFlags(): wasip2Types.filesystem.types.DescriptorFlags {
    return this.instance.getFlags()
  }

  getType(): wasip2Types.filesystem.types.DescriptorType {
    return this.instance.getType()
  }

  setSize(size: wasip2Types.filesystem.types.Filesize): void {
    return this.instance.setSize(size)
  }

  setTimes(dataAccessTimestamp: any, dataModificationTimestamp: any): void {
    return this.instance.setTimes(
      dataAccessTimestamp,
      dataModificationTimestamp,
    )
  }

  isSameObject(other: wasip2Types.filesystem.types.Descriptor): boolean {
    return this.instance.isSameObject(other)
  }

  metadataHash(): any {
    return this.instance.metadataHash()
  }

  metadataHashAt(
    pathFlags: wasip2Types.filesystem.types.PathFlags,
    path: string,
  ): any {
    return this.instance.metadataHashAt(pathFlags, path)
  }

  setTimesAt(
    pathFlags: wasip2Types.filesystem.types.PathFlags,
    path: string,
    dataAccessTimestamp: any,
    dataModificationTimestamp: any,
  ): void {
    return this.instance.setTimesAt(
      pathFlags,
      path,
      dataAccessTimestamp,
      dataModificationTimestamp,
    )
  }
}

// Adapter for InputStream
class InputStreamAdapter implements wasip2Types.io.streams.InputStream {
  private instance: ReturnType<typeof streams.InputStream.create>

  constructor() {
    this.instance = streams.InputStream.create()
  }

  read(len: bigint): Uint8Array {
    return this.instance.read(len)
  }

  blockingRead(len: bigint): Uint8Array {
    return this.instance.blockingRead(len)
  }

  skip(len: bigint): bigint {
    return this.instance.skip(len)
  }

  blockingSkip(len: bigint): bigint {
    return this.instance.blockingSkip(len)
  }

  subscribe(): wasip2Types.io.poll.Pollable {
    return this.instance.subscribe()
  }
}

// Adapter for OutputStream
class OutputStreamAdapter implements wasip2Types.io.streams.OutputStream {
  private instance: ReturnType<typeof streams.OutputStream.create>

  constructor() {
    this.instance = streams.OutputStream.create()
  }

  checkWrite(): bigint {
    return this.instance.checkWrite()
  }

  write(contents: Uint8Array): void {
    return this.instance.write(contents)
  }

  blockingWriteAndFlush(contents: Uint8Array): void {
    return this.instance.blockingWriteAndFlush(contents)
  }

  flush(): void {
    return this.instance.flush()
  }

  blockingFlush(): void {
    return this.instance.blockingFlush()
  }

  subscribe(): wasip2Types.io.poll.Pollable {
    return this.instance.subscribe()
  }

  writeZeroes(len: bigint): void {
    return this.instance.writeZeroes(len)
  }

  blockingWriteZeroesAndFlush(len: bigint): void {
    return this.instance.blockingWriteZeroesAndFlush(len)
  }

  splice(src: wasip2Types.io.streams.InputStream, len: bigint): bigint {
    // Safe cast needed for implementation detail compatibility
    return this.instance.splice(src as any, len)
  }

  blockingSplice(src: wasip2Types.io.streams.InputStream, len: bigint): bigint {
    // Safe cast needed for implementation detail compatibility
    return this.instance.blockingSplice(src as any, len)
  }
}

/**
 * Export all WASI Preview2 interfaces with their correct namespaces
 * for WebAssembly component integration
 */
export const wasip2: WASIP2 = {
  // NOTE: DO NOT use "as unknown as typeof..." type workarounds here.
  // NOTE: These MUST be directly compatible with the types.
  // NOTE: do NOT remove the previous two comments.
  'wasi:cli/environment': environment,
  'wasi:cli/stderr': stderr,
  'wasi:cli/stdin': stdin,
  'wasi:cli/stdout': stdout,
  'wasi:filesystem/preopens': {
    getDirectories: preopens.getDirectories,
  },
  'wasi:filesystem/types': {
    Descriptor: DescriptorAdapter,
    DirectoryEntryStream: DirectoryEntryStreamAdapter,
  },

  // IO interfaces
  'wasi:io/error': {
    Error: error.Error,
  },
  'wasi:io/streams': {
    InputStream: InputStreamAdapter,
    OutputStream: OutputStreamAdapter,
  },

  // Other interfaces
  'wasi:random/random': random,
  'wasi:io/poll': {
    Pollable: PollableAdapter,
  },
  'wasi:clocks/monotonic-clock': monotonicClock,
  'wasi:clocks/wall-clock': wallClock,
}
