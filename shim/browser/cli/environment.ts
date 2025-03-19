/**
 * Implementation of wasi:cli/environment@0.2.0 interface
 */

import type * as wasip2Types from '../../types/index.js'

// Default environment values
let environmentVariables: Array<[string, string]> = []
let commandLineArgs: Array<string> = []
let currentWorkingDir: string = '/'

/**
 * Set environment variables from an object
 * @param envObj Object containing environment variables
 */
export function setEnvironmentVariables(envObj: Record<string, string>): void {
  environmentVariables = Object.entries(envObj)
}

/**
 * Set command line arguments
 * @param args Array of command line arguments
 */
export function setCommandLineArgs(args: string[]): void {
  commandLineArgs = args
}

/**
 * Set the current working directory
 * @param cwd Current working directory path
 */
export function setCurrentWorkingDir(cwd: string): void {
  currentWorkingDir = cwd
}

/**
 * Get all environment variables
 * @returns Array of [key, value] pairs for environment variables
 */
export function getEnvironment(): Array<[string, string]> {
  return environmentVariables
}

/**
 * Get command line arguments
 * @returns Array of command line argument strings
 */
export function getArguments(): Array<string> {
  return commandLineArgs
}

/**
 * Get the initial working directory
 * @returns Path string of initial working directory
 */
export function initialCwd(): string | undefined {
  return currentWorkingDir
}

// Also export for internal use
export const environment = {
  getEnvironment,
  getArguments,
  initialCwd,
}
