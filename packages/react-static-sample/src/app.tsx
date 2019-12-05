import React from 'react'

import { StaticRoot, StaticRoutes } from '@react-static/core'

export default function App(): JSX.Element {
  return (
    <StaticRoot>
      <h1>Hello from react-static</h1>
      <StaticRoutes />
    </StaticRoot>
  )
}
