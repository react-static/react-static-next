import React, { useCallback, Suspense } from 'react'
import { RouteContext } from '../contexts/RouteContext'
import { useDeprecatedWarning } from '../hooks/useDeprecatedWarning'
import { hasValidStaticData, useStaticData } from '../hooks/useStaticData'
import { useStaticRoutes } from '../plugins/usePluginHook'
import { RoutePath } from '../../universal/RoutePath'

import { StaticRoutesProps as StaticRoutesPluginProps } from '@react-static/types'
import { getTemplate } from '../bootstrap'
import { suspendForRouteTemplate } from '../hooks/useRouteData'
import { useCurrentRoutePath } from '../hooks/useCurrentRoutePath'

// isolated module export, can't just re-export a type
export type StaticRoutesProps = StaticRoutesPluginProps

function getComponent(path: string): React.ComponentType<unknown> {
  const templatePath = suspendForRouteTemplate(path)
  const Template = getTemplate(templatePath)
  if (Template) {
    return Template
  }

  // TODO: throw and fetch

  return function FakeComponent(): JSX.Element {
    return <div>FakeComponent rendering the path: <code>{path}</code>; could not find a template</div>
  }
}

/**
 * @deprecated use StaticRoutes
 */
export function Routes(props: StaticRoutesProps): JSX.Element {
  useDeprecatedWarning(`
The "Routes" component has been renamed to "StaticRoutes".

Please rename your imports accordingly, as the "Routes" component will be
removed in a future version.
    `.trim()
  )

  return <StaticRoutes {...props} />
}


export function StaticRoutes<P extends object = {}>({ overridePath, loading, render, ...rest }: StaticRoutesProps & P): JSX.Element {
  const actualPath = useCurrentRoutePath()
  const resolvedRender = useStaticRoutes({ overridePath, render, ...rest })

  return (
    <Suspense fallback={loading || null}>
      <StaticRouteResolver overridePath={overridePath || actualPath} render={resolvedRender} {...rest} />
    </Suspense>
  )
}

function StaticRouteResolver({ overridePath, render, loading, ...rest }: StaticRoutesProps): JSX.Element {
  const staticData = useStaticData()
  let realPath: string

  if (typeof document === 'undefined') {
    if (hasValidStaticData(staticData)) {
      realPath = staticData.path
    } else {
      throw new Error('Expected staticData to be set, but it is not (path property missing in staticData).')
    }
  } else {
    realPath = overridePath || decodeURIComponent(window.location.pathname)
  }

  // Normalise it
  realPath = RoutePath.normalize(realPath)

  const optionalGetComponent = useCallback((forPath?: string) => getComponent(forPath || realPath), [realPath])

  if (render) {
    return (
      <RouteContext.Provider value={realPath}>
        {render(realPath, optionalGetComponent)}
      </RouteContext.Provider>
    )
  }

  const Comp = getComponent(realPath)

  return (
    <RouteContext.Provider value={realPath}>
      <Comp {...rest} />
    </RouteContext.Provider>
  )
}
