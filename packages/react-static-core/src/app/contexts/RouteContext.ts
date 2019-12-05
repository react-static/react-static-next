import React from 'react'

export const NO_VALUE_PROVIDED = Object.freeze({})

export const RouteContext = React.createContext<string | typeof NO_VALUE_PROVIDED>(NO_VALUE_PROVIDED)
export const CurrentRouteProvider = RouteContext.Provider
