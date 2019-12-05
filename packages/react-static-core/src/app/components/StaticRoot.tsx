import React, { Component, useState, useEffect, Suspense } from 'react'
import { useStaticRoot } from '../plugins/usePluginHook'
import { isDevelopment } from '../../universal/environment'
import { useDeprecatedWarning } from '../hooks/useDeprecatedWarning'

export interface StaticRootProps {
  children: React.ReactNode
  loading?: JSX.Element
}

/**
 * @deprecated use StaticRoot
 */
export function Root(props: StaticRootProps): JSX.Element {
  useDeprecatedWarning(`
The "Root" component has been renamed to "StaticRoot".

Please rename your imports accordingly, as the "Root" component will be
removed in a future version.
    `.trim()
  )

  return <StaticRoot {...props} />
}


export function StaticRoot({ children, loading }: StaticRootProps): JSX.Element {
  const ResolvedRoot = useStaticRoot()
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    if (!module || !module.hot) {
      return
    }

    // On hot reload, remove the current error
    function onHotReload(status: string): void {
      if (status === 'idle') {
        setError(undefined)
      }
    }

    module.hot.addStatusHandler(onHotReload)
    return (): void => module && module.hot && module.hot.removeStatusHandler(onHotReload)
  }, [])

  // TODO: yellow react code box (like in cra)
  return (
    <Catch onCatch={setError}>
      {error ? (
        <pre
          style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            background: '#222',
            color: 'white',
            margin: 0,
            padding: '1rem',
            overflow: 'scroll',
            fontSize: '14px',
          }}
        >
          {`An internal error occured!

${
        isDevelopment()
          ? error.stack
          : 'Please see the console for more details.'
        }
          `}
        </pre>
      ) : (
        <Suspense fallback={loading || <DefaultLoading />}>
          <ResolvedRoot>{children}</ResolvedRoot>
        </Suspense>
      )}
    </Catch>
  )
}

function DefaultLoading(): JSX.Element {
  if (!isDevelopment()) {
    return <div>Loading&hellip;</div>
  }

  return (
    <div>
      <p>
        The subtree is currently suspended because a component has thrown a
        Promise. You&apos;re now seeing the default loading fallback, which
        is probably not what you want.
      </p>
      <p>
        Add your own <code>&lt;Suspense /&gt;</code> component with the
        fallback property set. If you only want to &ldquo;fallback&rdquo; for
        the default suspensions of react-static, you only need to wrap
        the <code>&lt;StaticRoutes /&gt;</code> component.
      </p>
      <p>Some of the default origins of a suspension are:</p>
      <ul>
        <li><code>useSiteData</code></li>
        <li><code>useRouteData</code></li>
      </ul>
    </div>
  )
}

interface CatchProps {
  onCatch(error: Error): void
}

class Catch extends Component<CatchProps> {
  public static getDerivedStateFromError(_: Error): {} {
    return {}
  }

  public componentDidCatch(error: Error): void {
    this.props.onCatch(error)
  }

  public render(): React.ReactNode {
    return this.props.children
  }
}
