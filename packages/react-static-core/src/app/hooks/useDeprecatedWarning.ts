import { useState } from 'react'
import { isDevelopment } from '../../universal/environment'

export function useDeprecatedWarning(message: string | (() => string)): void {
  // This is okay, because isDevelopment's value will not change whilst react
  // is active, which means that the hook is not "in" a conditional.
  if (!isDevelopment()) {
    return
  }

  useState(() => {
    const warningMessage = typeof message === 'function' ? message() : message
    console.warn(warningMessage)
  })
}
