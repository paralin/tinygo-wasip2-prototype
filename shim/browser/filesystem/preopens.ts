/**
 * Implementation of wasi:filesystem/preopens@0.2.0 interface
 */

import { Descriptor, setFileSystemData, DirectoryEntryData } from './types.js'

// Initial empty filesystem
const initialFileSystemData = { dir: {} }

// Root directory descriptor and path
let preopenDirectories: Array<[Descriptor, string]> = [
  [Descriptor.fromEntry(initialFileSystemData), '/'],
]

/**
 * Initialize the filesystem with data
 * @param fileData Filesystem data to initialize with
 */
export function initializeFileSystem(fileData: DirectoryEntryData): void {
  setFileSystemData(fileData)
  preopenDirectories[0] = [Descriptor.fromEntry(fileData), '/']
}

/**
 * Get pre-opened directory descriptors
 * @returns Array of descriptor and path pairs
 */
function getDirectories(): Array<[Descriptor, string]> {
  return preopenDirectories
}

export const preopens = {
  getDirectories,
}
