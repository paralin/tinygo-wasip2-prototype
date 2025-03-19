/**
 * Implementation of component exit handling
 *
 * Note: This is not directly part of WASI Preview2 interfaces
 * but is used internally for error handling
 */

import type * as wasip2Types from '../../types/index.js'

/**
 * Custom error class for component exit conditions
 */
export class ComponentExit extends Error {
  /** Whether this is an exit error */
  public exitError: boolean

  /** Exit code (0 for success, non-zero for errors) */
  public code: number

  constructor(code: number) {
    super(
      `Component exited ${code === 0 ? 'successfully' : 'with error code ' + code}`,
    )
    this.exitError = true
    this.code = code
  }
}

/**
 * Exit the component with a status
 * @param status Exit status (ok or err)
 */
function exitWithStatus(status: 'ok' | 'err'): never {
  throw new ComponentExit(status === 'err' ? 1 : 0)
}

/**
 * Exit the component with a specific code
 * @param code Exit code (0 for success, non-zero for errors)
 */
function exitWithCode(code: number): never {
  throw new ComponentExit(code)
}

export const exit = {
  exit: exitWithStatus,
  exitWithCode,
}
