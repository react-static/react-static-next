import { hot } from 'react-hot-loader/root'
import React, { Fragment, Suspense, Component, useContext, useEffect, useRef } from 'react'
import { useLocation, Route } from 'react-router-dom'

import {
  bootstrap,
  useReloadOnChange,
  useSiteData,
  useCurrentRouteData,
  useCurrentRoutePath,
  useRouteData,
  PrefetchExclusions,
  StaticRoot,
  StaticRoutes,
} from '@react-static/core'

console.log('bootstrapping')
bootstrap()

// PrefetchExclusions.add('/missing')

// Export named App for testing
export function App(): JSX.Element {
  useReloadOnChange(() => console.info('Clearing site and route data...'))

  return (
    <StaticRoot>
      <h1 style={{ color: 'red' }}>Hello World</h1>

      <RouteData />
      <SiteData />
      <MissingRouteData />

      <Routes />
    </StaticRoot>
  )
}

function Loading(): JSX.Element {
  return <div>Loading...</div>
}

function SiteData(): JSX.Element {
  return (
    <ErrorBoundary>
      <h2>Site data</h2>
      <Suspense fallback={<Loading />}>
        <UnsafeSiteData />
      </Suspense>
    </ErrorBoundary>
  )
}

function RouteData(): JSX.Element {
  // render on each location, thanks react router / suspense
  useLocation()

  return (
    <Route path="/blog">
      <h2>Route data</h2>
      <Suspense fallback={<Loading />}>
        <UnsafeRouteData />
      </Suspense>
    </Route>
  )
}

function MissingRouteData(): JSX.Element {
  return (
    <ErrorBoundary>
      <h2>Route data (/missing)</h2>
      <Suspense fallback={<Loading />}>
        <UnsafeMissingRouteData />
      </Suspense>
    </ErrorBoundary>
  )
}

function UnsafeSiteData(): JSX.Element {
  const data = useSiteData()
  return <p>{JSON.stringify(data, null, 2)}</p>
}

function UnsafeRouteData(): JSX.Element {
  const count = useRef(0)

  useEffect(() => {
    count.current += 1
  })

  const path = useCurrentRoutePath()
  const data = useCurrentRouteData()

  return (
    <section>
      The path is: <code>{path}</code> / count: {count.current}
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </section>
  )
}

function UnsafeMissingRouteData(): JSX.Element {
  const data = useRouteData('missing/')
  return <p>{JSON.stringify(data, null, 2)}</p>
}

function Routes(): JSX.Element {
  return (
    <Fragment>
      <StaticRoutes loading={<Loading />} render={
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        (path, getComponent) => {
          const Component = getComponent(path)
          return (
            <section>
              <p>rendering: <code>{path}</code></p>
              <div style={{ padding: 10, border: '2px solid black' }}>
                <Component />
              </div>
            </section>
          )
        }
      } />
      <UnsafeRouteData/>
    </Fragment>
  )
}

class ErrorBoundary extends Component<
{},
{ error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: {}) {
    super(props)

    this.state = {}
  }

  public static getDerivedStateFromError(error: Error): Partial<{ error?: Error }> {
    return { error }
  }

  public render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div>{`${this.state.error.name}: ${this.state.error.message}`}</div>
      )
    }

    // eslint-disable-next-line react/prop-types
    return this.props.children
  }
}

// Export hot-reload enabled root element
export const HotApp = hot(App)
