import { useStaticData } from '@react-static/core'
import { CurrentRouteProvider } from '@react-static/core/dist/app/contexts/RouteContext'
import { BrowserPlugin, StaticRootComponent } from '@react-static/types'
import React from 'react'

import { StaticRouterProps } from 'react-router' // TODO: remove when typings are fixed
import { StaticRouter, useLocation, BrowserRouter, BrowserRouterProps } from 'react-router-dom'


export interface PluginOptions {
  BrowserRouterProps?: Partial<BrowserRouterProps>
  StaticRouterProps?: Partial<StaticRouterProps>
}

export default function ReactRouterPlugin(options: PluginOptions = {}): BrowserPlugin {
  const NextRoot: (PreviousRoot: StaticRootComponent) => StaticRootComponent = (PreviousRoot) => {

    // eslint-disable-next-line react/prop-types
    return function StaticRootWithReactRouter({ children } = { children: undefined }): JSX.Element {
      const staticData = useStaticData()

      if (typeof document !== 'undefined') {
        return (
          <PreviousRoot>
            <BrowserRouter {...options.BrowserRouterProps}>
              <RouterLocationToRouteContext>
                {children}
              </RouterLocationToRouteContext>
            </BrowserRouter>
          </PreviousRoot>
        )
      }

      if (!isValidStaticData(staticData)) {
        console.warn("@react-static/plugin-react-router: staticData is not valid")
        return <PreviousRoot>{children}</PreviousRoot>
      }

      return (
        <PreviousRoot>
          <StaticRouter context={{}} location={{ pathname: staticData.path }} {...options.StaticRouterProps}>
            {children}
          </StaticRouter>
        </PreviousRoot>
      )
    }
  }

  return {
    StaticRoot: NextRoot
  }
}

function RouterLocationToRouteContext({ children }: React.PropsWithChildren<{}>): JSX.Element {
  const location = useLocation()

  // When the location changes, the RouteContext is updated, making the children re-render,
  // or whichever component is using useContext(RouteContext)
  return (
    <CurrentRouteProvider value={location.pathname}>
      {children}
    </CurrentRouteProvider>
  )
}

function isValidStaticData(data: unknown): data is { path: string } {
  if (!(typeof data === 'object' && data)) {
    return false
  }

  return ('path' in data) && typeof (data as { path: unknown }).path === 'string'
}
