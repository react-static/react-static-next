import React, { Component, useState, useEffect, ReactSVG } from 'react'
import { usePluginHook } from '../plugins/usePluginHook'


export interface RootProps {
  children: React.ReactNode
}

export function Root({ children }: RootProps): JSX.Element {
  const ResolvedRoot = usePluginHook('Root', { children })
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
        process.env.NODE_ENV === 'production'
          ? 'Please see the console for more details.'
          : error.stack
        }
          `}
        </pre>
      ) : (
        <ResolvedRoot>{children}</ResolvedRoot>
      )}
    </Catch>
  )
}

interface CatchProps {
  onCatch(error: Error): void
}

class Catch extends Component<CatchProps> {
  public componentDidCatch(error: Error): void {
    this.props.onCatch(error)
  }

  public render(): React.ReactNode {
    return this.props.children
  }
}
