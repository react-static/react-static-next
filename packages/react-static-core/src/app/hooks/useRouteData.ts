import { useCurrentRoutePath } from './useCurrentRoutePath'
import { useSiteData } from './useSiteData'
import { delay } from '../delay'
import { fetchRouteInfo } from '../fetch/fetchRouteInfo'
import { onReload } from './useReloadOnChange'

import deepmerge from 'deepmerge'
import { FetchError } from '../fetch/FetchError'
import { RoutePath } from '../../universal/RoutePath'
import { useDebugValue } from 'react'
import { isDevelopment } from '../../universal/environment'

class RouteInfo {
  constructor(public readonly data: object, public readonly template: string) {
  }

  public get found(): boolean {
    return true
  }
}

class NotFoundRouteInfo extends RouteInfo {
  public get found(): boolean {
    return false
  }
}

class ErrorRouteInfo extends RouteInfo {
  constructor(public readonly error: Error) {
    super({}, '')
  }

  public get found(): boolean {
    return false
  }
}

const LOADED_ROUTE_DATA: Record<string, RouteInfo> = {}
const LOADING_ROUTE_DATA: Record<string, Promise<object>> = {}
const NORMALISED_404_PATH = RoutePath.normalize('/404')

/**
 * Get the route data for the current path
 */
export function useCurrentRouteData():
| ReturnType<typeof useRouteData>
| ErrorRouteInfo {
  const currentRoutePath = useCurrentRoutePath()
  return useRouteData(currentRoutePath)
}

function isLoaded(routePath: string): boolean {
  return LOADED_ROUTE_DATA[routePath] instanceof RouteInfo
}

/**
 * Attempts to load and store the route data for a given path.
 *
 * ⚠ if there is a known fetch (either in-flight or completed), it is used and
 * returned instead.
 *
 * @param {string} routePath the path
 * @returns {Promise<RouteInfo>}
 */
async function loadAndStore(routePath: string): Promise<RouteInfo> {
  const thisPromise = (
    LOADING_ROUTE_DATA[routePath] ||
    fetchRouteInfo(routePath, { priority: true })
  )

  // Only fetch if not already fetching
  LOADING_ROUTE_DATA[routePath] = thisPromise

  const info = await thisPromise.then((through) => through)

  if (isValidRouteInfo(info)) {
    const wrapped = NORMALISED_404_PATH === routePath
      ? new NotFoundRouteInfo(info.data, info.template)
      : new RouteInfo(info.data, info.template)

    LOADED_ROUTE_DATA[routePath] = wrapped
    return wrapped
  }

  if (NORMALISED_404_PATH === routePath) {
    throw new Error("Could not retrieve 404 data")
  }

  throw new Error(`Route ${routePath} returned no object (got: ${typeof info})`)
}

function loadAndStoreOrMark(routePath: string): ReturnType<typeof loadAndStore> {
  return loadAndStore(routePath).catch(
    (err) => {
      console.error(err)

      const result = new ErrorRouteInfo(err)
      const promise = Promise.reject(result.error)

      LOADED_ROUTE_DATA[routePath] = result
      LOADING_ROUTE_DATA[routePath] = promise

      // This is so this promise doesn't pollute the log. It's handled.
      promise.catch(() => { /* no-op */ })

      return Promise.resolve(result)
    }
  )
}

function isValidRouteInfo(info: object): info is { data: object, template: string } {
  if (typeof info !== 'object') {
    return false
  }

  if ('data' in info) {
    // type-check the data
    if (typeof (info as { data: unknown }).data !== 'object') {
      if (isDevelopment()) {
        console.warn(`The route has data attached, but expected an object, got '${typeof (info as { data: unknown }).data}.`)
      }

      return false
    }
  }

  if ('template' in info) {
    // type-check the template
    if (typeof (info as { template: unknown }).template !== 'string') {
      if (isDevelopment()) {
        console.warn(`The route has a template attached, but expected a string, got '${typeof (info as { template: unknown }).template}.`)
      }

      return false
    }
  } else {
    // template is required
    return false
  }

  // TODO: typecheck data and template
  return true
}

function getRouteInfo(routePath: string): RouteInfo {
  const wrapped = LOADED_ROUTE_DATA[routePath]

  if (wrapped instanceof ErrorRouteInfo) {
    if (wrapped.error instanceof FetchError) {
      if (wrapped.error.status === 404 && RoutePath.normalize(routePath) !== NORMALISED_404_PATH) {
        const dataNotFound = getRouteInfo(NORMALISED_404_PATH)

        if (dataNotFound) {
          return dataNotFound
        }

        throw loadAndStoreOrMark(NORMALISED_404_PATH)
      }

      throw wrapped.error
    }
  }

  return wrapped

}

function getRouteData(routePath: string): object {
  return getRouteInfo(routePath).data
}

function getRouteTemplate(routePath: string): string {
  return getRouteInfo(routePath).template

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
  const normalised = RoutePath.normalize(routePath)
  const dataReady = isLoaded(normalised)

  useDebugValue(
    { flag: dataReady, path: normalised },
    ({ flag, path }) => `RouteData of ${path} ${flag ? 'ready' : 'needs fetching'}`
  )

  const siteData = useSiteData()

  if (dataReady) {
    return deepmerge(siteData || {}, getRouteData(normalised) || {})
  }

  throw loadAndStoreOrMark(normalised)
}
// Promise.all([delay(500), loadAndStore(normalised)])

/**
 * Similar to useRouteData, but not actually a hook as it does not depend on
 * other hooks (sub-hooks).
 *
 * @see useRouteData
 */
export function suspendForRouteTemplate(routePath: string): string {
  const normalised = RoutePath.normalize(routePath)

  if (isLoaded(normalised)) {
    return getRouteTemplate(routePath)
  }

  throw loadAndStoreOrMark(normalised)
}

// Promise.all([delay(500), loadAndStore(normalised)])

// On reload, register to remove all the things
onReload(() => {
  Object.keys(LOADED_ROUTE_DATA).forEach((key) => {
    delete LOADED_ROUTE_DATA[key]
    delete LOADING_ROUTE_DATA[key]
  })
})
