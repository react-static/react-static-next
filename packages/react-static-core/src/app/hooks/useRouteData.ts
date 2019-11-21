import { useCurrentRoutePath } from './useCurrentRoutePath'
import { useSiteData } from './useSiteData'
import { delay } from '../delay'
import { fetchRouteInfo } from '../fetch/fetchRouteInfo'
import { onReload } from './useReloadOnChange'

import deepmerge from 'deepmerge'

const LOADED_ROUTE_DATA: Record<string, object> = {}
const LOADING_ROUTE_DATA: Record<string, Promise<unknown>> = {}

export function useCurrentRouteData():
| ReturnType<typeof useRouteData>
| undefined {
  const currentRoutePath = useCurrentRoutePath()
  return typeof currentRoutePath === 'string'
    ? useRouteData(currentRoutePath)
    : undefined
}

function isLoaded(routePath: string): boolean {
  return typeof LOADED_ROUTE_DATA[routePath] !== 'undefined'
}

async function loadAndStore(routePath: string): Promise<object> {
  // Only fetch if not already fetching
  LOADING_ROUTE_DATA[routePath] =
    LOADING_ROUTE_DATA[routePath] ||
    fetchRouteInfo(routePath, { priority: true })

  const data = await LOADING_ROUTE_DATA[routePath]

  if (typeof data === 'object' && data) {
    LOADED_ROUTE_DATA[routePath] = data
    return Promise.resolve(data)
  }

  return Promise.reject(
    new Error(`Route ${routePath} returned no object (got: ${typeof data})`)
  )
}

function getRouteData(routePath: string): object {
  return LOADED_ROUTE_DATA[routePath]
}

/**
 * Fetches the route data for the given route.
 *
 * In production, this file lives local to the route path.
 * In development, this file is "generated" on the fly.
 *
 * @export
 * @param {string} routePath
 * @returns {object}
 */
export function useRouteData(routePath: string): object {
  const siteData = useSiteData()

  if (isLoaded(routePath)) {
    return deepmerge(siteData, getRouteData(routePath))
  }

  throw Promise.all([delay(500), loadAndStore(routePath)])
}

// On reload, register to remove all the things
onReload(() => {
  Object.keys(LOADED_ROUTE_DATA).forEach((key) => {
    delete LOADED_ROUTE_DATA[key]
    delete LOADING_ROUTE_DATA[key]
  })
})
