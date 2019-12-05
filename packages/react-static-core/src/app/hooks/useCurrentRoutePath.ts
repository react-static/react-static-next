import { useContext } from 'react'
import { RouteContext, NO_VALUE_PROVIDED } from '../contexts/RouteContext'
import { isDevelopment } from '../../universal/environment'

class NotInContextTree extends Error {
  constructor() {
    super(`
You've called "useCurrentRoutePath" (either directly or via something else
that uses it), but there is no path available. This usually means that the
call is not done inside the <StaticRoot> component tree, or because no router
has been added to the plugin chain, for example:

- @react-static/plugin-react-router
- @react-static/plugin-reach-router

Alternatively, you may add the following import:

  import { CurrentRouteProvider } from '@react-static/core/dist/app/contexts/RouteContext'

...and provide the path yourself. Anywhere inside the subtree of this provider,
the calls to useCurrentRoutePath and those that depend on it will work, as long
as a value is given.

Note: the path should always start with a / and should never have a trailing /.
    `.trim())
    Error.captureStackTrace(this, this.constructor)
  }
}

export function useCurrentRoutePath(): string {
  const value = useContext(RouteContext)

  if (typeof value !== 'string' || value.length === 0 || value === NO_VALUE_PROVIDED) {
    if (isDevelopment()) {
      throw new NotInContextTree()
    }

    return '/'
  }

  return value
}
