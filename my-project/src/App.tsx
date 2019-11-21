import { hot } from 'react-hot-loader/root'
import React, { Suspense, Component } from 'react'

import { bootstrap } from '@react-static/core/src/app/bootstrap'
import { useReloadOnChange } from '@react-static/core/src/app/hooks/useReloadOnChange'
import { useSiteData } from '@react-static/core/src/app/hooks/useSiteData'
import { useCurrentRouteData } from '@react-static/core/src/app/hooks/useRouteData'

bootstrap()

// Export named App for testing
export function App(): JSX.Element {
  useReloadOnChange(() => console.log('Clearing site and route data...'))

  return (
    <div>
      <h1>Hello World</h1>
      <SiteData />
      <RouteData />
    </div>
  )
}

function Loading() {
  return <div>Loading...</div>
}

function SiteData() {
  return (
    <ErrorBoundary>
      <h2>Site data</h2>
      <Suspense fallback={<Loading />}>
        <UnsafeSiteData />
      </Suspense>
    </ErrorBoundary>
  )
}

function RouteData() {
  return (
    <ErrorBoundary>
      <h2>Route data</h2>
      <Suspense fallback={<Loading />}>
        <UnsafeRouteData />
      </Suspense>
    </ErrorBoundary>
  )
}

function UnsafeSiteData() {
  const data = useSiteData()
  return <p>{JSON.stringify(data, null, 2)}</p>
}

function UnsafeRouteData() {
  const data = useCurrentRouteData()
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
