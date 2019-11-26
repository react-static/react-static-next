import { hot } from 'react-hot-loader/root'
import React, { Suspense, Component } from 'react'

import {
  bootstrap,
  useReloadOnChange,
  useSiteData,
  useCurrentRouteData,
  useRouteData,
  PrefetchExclusions } from '@react-static/core'




bootstrap()


PrefetchExclusions.add('/missing')

// Export named App for testing
export function App(): JSX.Element {
  useReloadOnChange(() => console.log('Clearing site and route data...'))

  return (
    <div>
      <h1>Hello World</h1>
      <SiteData />
      <RouteData />
      <MissingRouteData />
    </div>
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
  return (
    <ErrorBoundary>
      <h2>Route data</h2>
      <Suspense fallback={<Loading />}>
        <UnsafeRouteData />
      </Suspense>
    </ErrorBoundary>
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
  const data = useCurrentRouteData()
  return <p>{JSON.stringify(data, null, 2)}</p>
}

function UnsafeMissingRouteData(): JSX.Element {
  const data = useRouteData('missing/')
  return <p>{JSON.stringify(data, null, 2)}</p>
}

class ErrorBoundary extends Component<
{},
{ error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: {}) {
    super(props)

    this.state = {}
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(error)
    this.setState({ error, errorInfo })
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
