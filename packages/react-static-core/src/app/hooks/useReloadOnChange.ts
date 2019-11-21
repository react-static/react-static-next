import { useCallback, useEffect, useState } from 'react'

const listeners: Array<() => void> = []

/**
 * Hook that re-renders a component when triggerReload is called. Accepts an
 * optional side-effect to execute onTriggered.
 */
export function useReloadOnChange(onTriggered?: () => void): void {
  const [_, forceReload] = useState(0)

  const listener = useCallback(() => {
    onTriggered && onTriggered()
    forceReload((count: number) => count + 1)
  }, [forceReload, onTriggered])

  useEffect((): (() => void) => {
    return onReload(listener)
  }, [listener])
}

/**
 * Force a reload for all listeners, usually when a message comes in through
 * the "message development port socket".
 *
 * @export
 */
export function triggerReload(): void {
  listeners.forEach((listener) => listener())
}

/**
 * Register a listener to be called when triggerReload is executed. Returns
 * a function to remove the listener.
 */
export function onReload(listener: () => void): () => void {
  listeners.push(listener)

  return (): void => {
    const index = listeners.indexOf(listener)
    console.log('Trying to remove listener', index)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
  }
}
