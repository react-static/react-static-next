import React from 'react'

// If window is available, it might have routeInfo.
type WindowWithReactStatic = (Window & typeof globalThis) & {
  __routeInfo: unknown
}

export const StaticInfoContext = React.createContext<unknown>(
  typeof window === 'undefined'
    ? undefined
    : (window as WindowWithReactStatic).__routeInfo
)
