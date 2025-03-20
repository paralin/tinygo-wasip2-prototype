/**
 * Implementation of wasi:filesystem/types@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'
import {
  DescriptorStat,
  DescriptorType,
  Filesize,
  OpenFlags,
} from '../../types/interfaces/wasi-filesystem-types.js'

/**
 * Standard Error class with payload for WASI error codes
 * implements Error interface from io/error to ensure it's a valid error type
 */
import { WasiIoError } from '../io/error.js'

export class FileSystemError extends WasiIoError {
  payload: wasip2Types.filesystem.types.ErrorCode

  constructor(errorCode: wasip2Types.filesystem.types.ErrorCode) {
    super(`FileSystem error: ${errorCode}`)
    this.payload = errorCode
    this.name = 'FileSystemError'
  }

  toDebugString(): string {
    return `FileSystem error: ${this.payload}`
  }
}

/**
 * Create a typed payload error for filesystem operations
 */
export function createError(
  errorCode: wasip2Types.filesystem.types.ErrorCode,
): never {
  throw new FileSystemError(errorCode)
}

/**
 * In-memory filesystem data structure
 */
export interface FileEntry {
  source: Uint8Array | string
}

export interface DirectoryEntryData {
  dir: Record<string, DirectoryEntryData | FileEntry>
}

// Default timestamp for filesystem entries
const timeZero: wasip2Types.clocks.wallClock.Datetime = {
  seconds: BigInt(0),
  nanoseconds: 0,
}

/**
 * Global filesystem state
 */
let fileSystemData: DirectoryEntryData = { dir: {} }
let currentWorkingDirectory = '/'

/**
 * Set the current working directory
 */
export function setCurrentWorkingDirectory(cwd: string): void {
  currentWorkingDirectory = cwd
}

/**
 * Set the filesystem data
 */
export function setFileSystemData(data: DirectoryEntryData): void {
  fileSystemData = data
}

/**
 * Get the filesystem data (for debugging)
 */
export function getFileSystemData(): string {
  return JSON.stringify(fileSystemData)
}

/**
 * Convert string data to Uint8Array if needed
 */
function getSourceData(fileEntry: FileEntry): Uint8Array {
  if (typeof fileEntry.source === 'string') {
    fileEntry.source = new TextEncoder().encode(fileEntry.source)
  }
  return fileEntry.source as Uint8Array
}

/**
 * Find an entry in the filesystem
 * @returns The found entry or throws a FileSystemError
 */
function getChildEntry(
  parentEntry: DirectoryEntryData,
  subpath: string,
  openFlags: wasip2Types.filesystem.types.OpenFlags,
): DirectoryEntryData | FileEntry {
  if (!parentEntry || !parentEntry.dir) {
    createError('not-directory')
  }

  // Special handling for current working directory
  if (subpath === '.') {
    subpath = currentWorkingDirectory
    if (subpath.startsWith('/') && subpath !== '/') {
      subpath = subpath.slice(1)
    }
  }

  let entry: DirectoryEntryData | FileEntry = parentEntry
  let segments = subpath.split('/').filter((segment) => segment !== '')

  for (const segment of segments) {
    if (!entry || !(entry as DirectoryEntryData).dir) {
      createError('not-directory')
    }

    if (segment === '..') {
      createError('no-entry')
    }

    if (segment === '.') {
      continue
    }

    const dirEntry = entry as DirectoryEntryData

    if (!dirEntry.dir[segment] && openFlags.create) {
      if (openFlags.directory) {
        entry = dirEntry.dir[segment] = { dir: {} }
      } else {
        entry = dirEntry.dir[segment] = { source: new Uint8Array([]) }
      }
    } else {
      entry = dirEntry.dir[segment]
    }

    if (!entry) {
      createError('no-entry')
    }
  }

  return entry
}

/**
 * Directory entry stream for reading directory contents
 */
export class DirectoryEntryStream
  implements wasip2Types.filesystem.types.DirectoryEntryStream
{
  private entries: [string, DirectoryEntryData | FileEntry][]
  private index: number

  /**
   * Private constructor with no parameters to match interface definition
   */
  private constructor() {
    this.index = 0
    this.entries = []
  }

  /**
   * Static factory method to create a DirectoryEntryStream
   * Used to satisfy typechecking requirements for parameterless constructor
   */
  public static create(): DirectoryEntryStream {
    return new DirectoryEntryStream()
  }

  /**
   * Static factory method to create a DirectoryEntryStream with entries
   */
  public static fromEntries(
    entries: [string, DirectoryEntryData | FileEntry][],
  ): DirectoryEntryStream {
    const stream = new DirectoryEntryStream()
    stream.entries = entries
    return stream
  }

  /**
   * Read a directory entry
   * @returns The next directory entry or undefined if no more entries
   */
  readDirectoryEntry():
    | wasip2Types.filesystem.types.DirectoryEntry
    | undefined {
    if (this.index === this.entries.length) {
      return undefined
    }

    const [name, entry] = this.entries[this.index]
    this.index += 1

    return {
      name,
      type: (entry as DirectoryEntryData).dir ? 'directory' : 'regular-file',
    }
  }
}

/**
 * Descriptor class for file operations
 */
export class Descriptor implements wasip2Types.filesystem.types.Descriptor {
  private entry: DirectoryEntryData | FileEntry
  private isStream: boolean
  private modificationTime: number = 0

  /**
   * Private constructor with no parameters to match interface definition
   */
  private constructor() {
    // Initialize with default values
    this.entry = { dir: {} }
    this.isStream = false
  }

  /**
   * Static factory method to create a Descriptor
   * Used to satisfy typechecking requirements for parameterless constructor
   */
  public static create(): Descriptor {
    // Create a root directory as default
    return new Descriptor()
  }

  /**
   * Static factory method to create a Descriptor with specific entry
   */
  public static fromEntry(
    entry: DirectoryEntryData | FileEntry,
    isStream: boolean = false,
  ): Descriptor {
    const descriptor = new Descriptor()
    descriptor.entry = entry
    descriptor.isStream = isStream
    return descriptor
  }

  /**
   * Set times for a file path relative to this descriptor
   */
  setTimesAt(
    pathFlags: wasip2Types.filesystem.types.PathFlags,
    path: string,
    dataAccessTimestamp: wasip2Types.filesystem.types.Datetime,
    dataModificationTimestamp: wasip2Types.filesystem.types.Datetime,
  ): void {
    createError('unsupported')
  }

  // Implementing required methods from the interface
  readViaStream(
    offset: wasip2Types.filesystem.types.Filesize,
  ): wasip2Types.io.streams.InputStream {
    createError('unsupported')
  }

  writeViaStream(
    offset: wasip2Types.filesystem.types.Filesize,
  ): wasip2Types.io.streams.OutputStream {
    createError('unsupported')
  }

  appendViaStream(): wasip2Types.io.streams.OutputStream {
    createError('unsupported')
  }

  sync(): void {
    // No-op in browser implementation
  }

  setFlags(flags: wasip2Types.filesystem.types.DescriptorFlags): void {
    // No-op in browser implementation
  }

  getFlags(): wasip2Types.filesystem.types.DescriptorFlags {
    return { read: true, write: true }
  }

  getType(): wasip2Types.filesystem.types.DescriptorType {
    if ((this.entry as DirectoryEntryData).dir) {
      return 'directory'
    }
    return 'regular-file'
  }

  setSize(size: wasip2Types.filesystem.types.Filesize): void {
    createError('unsupported')
  }

  setTimes(
    dataAccessTimestamp: wasip2Types.filesystem.types.Datetime,
    dataModificationTimestamp: wasip2Types.filesystem.types.Datetime,
  ): void {
    createError('unsupported')
  }

  isSameObject(other: wasip2Types.filesystem.types.Descriptor): boolean {
    if (other instanceof Descriptor) {
      return this.entry === (other as Descriptor).getEntry()
    }
    return false
  }

  /**
   * Get the entry referenced by this descriptor (internal use)
   */
  getEntry(): DirectoryEntryData | FileEntry {
    return this.entry
  }

  /**
   * Sync data to "disk" (no-op in this implementation)
   */
  syncData(): void {
    // No-op in browser implementation
  }

  /**
   * Read from a file
   * @returns [data, eof] tuple or throws a FileSystemError
   */
  read(length: Filesize, offset: Filesize): [Uint8Array, boolean] {
    if ((this.entry as DirectoryEntryData).dir) {
      createError('is-directory')
    }

    const source = getSourceData(this.entry as FileEntry)
    const offsetNum = Number(offset)
    const lengthNum = Number(length)

    const data = source.slice(offsetNum, offsetNum + lengthNum)
    const eof = offsetNum + data.byteLength >= source.byteLength

    return [data, eof]
  }

  /**
   * Write to a file
   * @returns The number of bytes written or throws a FileSystemError
   */
  write(buffer: Uint8Array, offset: Filesize): Filesize {
    if ((this.entry as DirectoryEntryData).dir) {
      createError('is-directory')
    }

    const fileEntry = this.entry as FileEntry
    const offsetNum = Number(offset)

    // Create or resize the destination buffer if needed
    const source = getSourceData(fileEntry)
    const newSize = Math.max(source.byteLength, offsetNum + buffer.byteLength)
    const newSource = new Uint8Array(newSize)

    // Copy existing data
    newSource.set(source, 0)

    // Write new data at the offset
    newSource.set(buffer, offsetNum)

    // Update the file
    fileEntry.source = newSource
    this.modificationTime = Date.now()

    return BigInt(buffer.byteLength)
  }

  /**
   * Read directory entries
   * @returns DirectoryEntryStream or throws a FileSystemError
   */
  readDirectory(): DirectoryEntryStream {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      createError('bad-descriptor')
    }

    const entries = Object.entries(dirEntry.dir).sort(([a], [b]) =>
      a > b ? 1 : -1,
    )
    return DirectoryEntryStream.fromEntries(entries)
  }

  /**
   * Create a directory
   * @returns void or throws a FileSystemError
   */
  createDirectoryAt(path: string): void {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      createError('not-directory')
    }

    const entry = getChildEntry(dirEntry, path, {
      create: true,
      directory: true,
    })

    if ((entry as FileEntry).source) {
      createError('exist')
    }
  }

  /**
   * Get file stats
   * @returns DescriptorStat or throws a FileSystemError
   */
  stat(): DescriptorStat {
    let type: DescriptorType = 'unknown'
    let size: Filesize = BigInt(0)

    if ((this.entry as FileEntry).source) {
      type = 'regular-file'
      const source = getSourceData(this.entry as FileEntry)
      size = BigInt(source.byteLength)
    } else if ((this.entry as DirectoryEntryData).dir) {
      type = 'directory'
    }

    return {
      type,
      linkCount: BigInt(1),
      size,
      dataAccessTimestamp: timeZero,
      dataModificationTimestamp: timeZero,
      statusChangeTimestamp: timeZero,
    }
  }

  /**
   * Get file stats for a path relative to this descriptor
   * @returns The file stats or throws a FileSystemError
   */
  statAt(
    _pathFlags: wasip2Types.filesystem.types.PathFlags,
    path: string,
  ): DescriptorStat {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      createError('not-directory')
    }

    const entry = getChildEntry(dirEntry, path, { create: false })
    let type: DescriptorType = 'unknown'
    let size: Filesize = BigInt(0)

    if ((entry as FileEntry).source) {
      type = 'regular-file'
      const source = getSourceData(entry as FileEntry)
      size = BigInt(source.byteLength)
    } else if ((entry as DirectoryEntryData).dir) {
      type = 'directory'
    }

    return {
      type,
      linkCount: BigInt(1),
      size,
      dataAccessTimestamp: timeZero,
      dataModificationTimestamp: timeZero,
      statusChangeTimestamp: timeZero,
    }
  }

  /**
   * Create a link (not implemented)
   * @returns Never returns, always throws a FileSystemError
   */
  linkAt(
    oldPathFlags: wasip2Types.filesystem.types.PathFlags,
    oldPath: string,
    newDescriptor: wasip2Types.filesystem.types.Descriptor,
    newPath: string,
  ): void {
    createError('unsupported')
  }

  /**
   * Open a file relative to this descriptor
   * @returns The new Descriptor or throws a FileSystemError
   */
  openAt(
    pathFlags: wasip2Types.filesystem.types.PathFlags,
    path: string,
    openFlags: wasip2Types.filesystem.types.OpenFlags,
    flags: wasip2Types.filesystem.types.DescriptorFlags,
  ): wasip2Types.filesystem.types.Descriptor {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      createError('not-directory')
    }

    const entry = getChildEntry(dirEntry, path, openFlags as OpenFlags)
    return Descriptor.fromEntry(entry)
  }

  /**
   * Read a symbolic link (not implemented)
   * @returns Never returns, always throws a FileSystemError
   */
  readlinkAt(_path: string): never {
    createError('unsupported')
  }

  /**
   * Remove a directory (not implemented)
   * @returns Never returns, always throws a FileSystemError
   */
  removeDirectoryAt(_path: string): never {
    createError('unsupported')
  }

  /**
   * Rename a file or directory (not implemented)
   * @returns Never returns, always throws a FileSystemError
   */
  renameAt(
    oldPath: string,
    newDescriptor: wasip2Types.filesystem.types.Descriptor,
    newPath: string,
  ): void {
    createError('unsupported')
  }

  /**
   * Create a symbolic link (not implemented)
   * @returns Never returns, always throws a FileSystemError
   */
  symlinkAt(_oldPath: string, _newPath: string): never {
    createError('unsupported')
  }

  /**
   * Remove a file (not implemented)
   * @returns Never returns, always throws a FileSystemError
   */
  unlinkFileAt(_path: string): never {
    createError('unsupported')
  }
}

/**
 * Extracts a filesystem error code from a stream error
 * @param err The error to extract from
 * @returns The filesystem error code if available
 */
function filesystemErrorCode(
  err: wasip2Types.io.error.Error,
): wasip2Types.filesystem.types.ErrorCode | undefined {
  // Basic implementation that tries to extract an error code
  // from a FileSystemError
  if (err instanceof FileSystemError) {
    return err.payload
  }

  // For other errors with a payload property that might be an error code
  if (err && typeof err === 'object' && 'payload' in err) {
    const payload = (err as any).payload
    if (typeof payload === 'string') {
      // This is a simplification - in a real implementation we would validate the error code
      return payload as wasip2Types.filesystem.types.ErrorCode
    }
  }

  // For other errors, return undefined
  return undefined
}

export const types = {
  Descriptor,
  DirectoryEntryStream,
  filesystemErrorCode,
}
