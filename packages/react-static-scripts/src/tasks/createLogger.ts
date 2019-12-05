import { State } from "@react-static/types";
import { isDevelopment } from "@react-static/core";

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
