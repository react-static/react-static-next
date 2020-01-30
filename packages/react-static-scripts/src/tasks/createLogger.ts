import { State } from "@react-static/types";
import { isDevelopment } from "@react-static/core";

/**
 * Creates a logger that will log to console, or a new Console, based on the
 * availability. You can configure the verbosity using the configuration
 * options such as "silent" and "verbose".
 *
 * By default, it will only show log() messages in (internal) development, and
 * only show debug() messages when running with "verbose". When running with
 * "silent", only error() messages are logged.
 *
 * The logger is passed into the state, so all hooks and plugins can access
 * this particular logger, which is recommended.
 */
export function createLogger(rawState: Readonly<State>): State {
  const logger = typeof console !== 'undefined' ? console : new Console()

  if (rawState.config.silent) {
    logger.debug = noop
    logger.log = noop
    logger.info = noop
    return { ...rawState, logger }
  }

  // poly-fill
  if (typeof logger.debug !== 'function') {
    logger.debug = logger.log
  }

  if (typeof logger.info !== 'function') {
    logger.info = logger.log
  }

  if (typeof logger.warn !== 'function') {
    logger.warn = logger.log
  }

  if (!rawState.config.verbose) {
    logger.debug = noop
    logger.log = isDevelopment() ? logger.log : noop
    return { ...rawState, logger }
  }

  return { ...rawState, logger }
}

function noop(...args: unknown[]): void {
  /* noop */
}
