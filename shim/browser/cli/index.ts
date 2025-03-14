/**
 * CLI module exports
 */

export {
  environment,
  getArguments,
  getEnvironment,
  initialCwd,
} from './environment.js'
export { exit } from './exit.js'
export {
  stdin,
  stdout,
  stderr,
  setStdinHandler,
  setStdoutHandler,
  setStderrHandler,
} from './streams.js'
