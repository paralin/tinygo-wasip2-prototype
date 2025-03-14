/**
 * Implementation of wasi:filesystem/types@0.2.0 interface
 */

import { InputStream, OutputStream } from '../io/streams.js'
import type { Datetime } from '../clocks/wall-clock.js'

/**
 * Types from WASI filesystem interface
 */
export type ErrorCode =
  | 'access'
  | 'would-block'
  | 'already'
  | 'bad-descriptor'
  | 'busy'
  | 'deadlock'
  | 'quota'
  | 'exist'
  | 'file-too-large'
  | 'illegal-byte-sequence'
  | 'in-progress'
  | 'interrupted'
  | 'invalid'
  | 'io'
  | 'is-directory'
  | 'loop'
  | 'too-many-links'
  | 'message-size'
  | 'name-too-long'
  | 'no-device'
  | 'no-entry'
  | 'no-lock'
  | 'insufficient-memory'
  | 'insufficient-space'
  | 'not-directory'
  | 'not-empty'
  | 'not-recoverable'
  | 'unsupported'
  | 'no-tty'
  | 'no-such-device'
  | 'overflow'
  | 'not-permitted'
  | 'pipe'
  | 'read-only'
  | 'invalid-seek'
  | 'text-file-busy'
  | 'cross-device'

export type Filesize = bigint
export type LinkCount = bigint

export type DescriptorType =
  | 'unknown'
  | 'block-device'
  | 'character-device'
  | 'directory'
  | 'fifo'
  | 'symbolic-link'
  | 'regular-file'
  | 'socket'

export interface DescriptorStat {
  type: DescriptorType
  linkCount: LinkCount
  size: Filesize
  dataAccessTimestamp?: Datetime
  dataModificationTimestamp?: Datetime
  statusChangeTimestamp?: Datetime
}

export interface PathFlags {
  symlinkFollow?: boolean
}

export interface OpenFlags {
  create?: boolean
  directory?: boolean
  exclusive?: boolean
  truncate?: boolean
}

export interface DescriptorFlags {
  read?: boolean
  write?: boolean
  fileIntegritySync?: boolean
  dataIntegritySync?: boolean
  requestedWriteSync?: boolean
  mutateDirectory?: boolean
}

export interface DirectoryEntry {
  type: DescriptorType
  name: string
}

/**
 * In-memory filesystem data structure
 */
interface FileEntry {
  source: Uint8Array | string
}

interface DirectoryEntryData {
  dir: Record<string, DirectoryEntryData | FileEntry>
}

// Default timestamp for filesystem entries
const timeZero: Datetime = {
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
 */
function getChildEntry(
  parentEntry: DirectoryEntryData,
  subpath: string,
  openFlags: OpenFlags,
): DirectoryEntryData | FileEntry {
  if (!parentEntry || !parentEntry.dir) {
    throw new Error('not-directory')
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
      throw new Error('not-directory')
    }

    if (segment === '..') {
      throw new Error('no-entry')
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
      throw new Error('no-entry')
    }
  }

  return entry
}

/**
 * Directory entry stream for reading directory contents
 */
export class DirectoryEntryStream {
  private entries: [string, DirectoryEntryData | FileEntry][]
  private index: number

  constructor(entries: [string, DirectoryEntryData | FileEntry][]) {
    this.index = 0
    this.entries = entries
  }

  readDirectoryEntry(): DirectoryEntry | undefined {
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
export class Descriptor {
  private entry: DirectoryEntryData | FileEntry
  private isStream: boolean
  private modificationTime: number = 0

  constructor(
    entry: DirectoryEntryData | FileEntry,
    isStream: boolean = false,
  ) {
    this.entry = entry
    this.isStream = isStream
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
   */
  read(length: Filesize, offset: Filesize): [Uint8Array, boolean] {
    if ((this.entry as DirectoryEntryData).dir) {
      throw new Error('is-directory')
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
   */
  write(buffer: Uint8Array, offset: Filesize): Filesize {
    if ((this.entry as DirectoryEntryData).dir) {
      throw new Error('is-directory')
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
   */
  readDirectory(): DirectoryEntryStream {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      throw new Error('bad-descriptor')
    }

    const entries = Object.entries(dirEntry.dir).sort(([a], [b]) =>
      a > b ? 1 : -1,
    )
    return new DirectoryEntryStream(entries)
  }

  /**
   * Create a directory
   */
  createDirectoryAt(path: string): void {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      throw new Error('not-directory')
    }

    const entry = getChildEntry(dirEntry, path, {
      create: true,
      directory: true,
    })

    if ((entry as FileEntry).source) {
      throw new Error('exist')
    }
  }

  /**
   * Get file stats
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
   */
  statAt(_pathFlags: PathFlags, path: string): DescriptorStat {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      throw new Error('not-directory')
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
   */
  linkAt(
    _oldPathFlags: PathFlags,
    _oldPath: string,
    _newDescriptor: Descriptor,
    _newPath: string,
  ): void {
    throw new Error('unsupported')
  }

  /**
   * Open a file relative to this descriptor
   */
  openAt(
    _pathFlags: PathFlags,
    path: string,
    openFlags: OpenFlags,
    _descriptorFlags: DescriptorFlags,
  ): Descriptor {
    const dirEntry = this.entry as DirectoryEntryData

    if (!dirEntry.dir) {
      throw new Error('not-directory')
    }

    const childEntry = getChildEntry(dirEntry, path, openFlags)
    return new Descriptor(childEntry)
  }

  /**
   * Read a symbolic link (not implemented)
   */
  readlinkAt(_path: string): string {
    throw new Error('unsupported')
  }

  /**
   * Remove a directory (not implemented)
   */
  removeDirectoryAt(_path: string): void {
    throw new Error('unsupported')
  }

  /**
   * Rename a file or directory (not implemented)
   */
  renameAt(
    _oldPath: string,
    _newDescriptor: Descriptor,
    _newPath: string,
  ): void {
    throw new Error('unsupported')
  }

  /**
   * Create a symbolic link (not implemented)
   */
  symlinkAt(_oldPath: string, _newPath: string): void {
    throw new Error('unsupported')
  }

  /**
   * Remove a file (not implemented)
   */
  unlinkFileAt(_path: string): void {
    throw new Error('unsupported')
  }
}

export const types = {
  Descriptor,
  DirectoryEntryStream,
}
