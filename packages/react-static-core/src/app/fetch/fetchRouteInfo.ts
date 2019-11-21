import { isDevelopment } from '../../isDevelopment'
import { PrefetchExclusions } from '../configuration'
import { FetchError } from './FetchError'

import { ROUTES } from '../../routes'

import ky, { HTTPError } from 'ky-universal'

const EMPTY_INFO = Object.freeze({})

function isPrefetchableRoute(routePath: string): boolean {
  // Don't prefetch in SSR
  if (typeof document === 'undefined') {
    return false
  }

  // Don't prefetch excluded routes
  if (PrefetchExclusions.contains(routePath)) {
    return false
  }

  // Otherwise it's fine
  return true
}

function getRouteInfoRoot(): string {
  // TODO use public path or site root
  return ''
}

export async function fetchRouteInfo(
  routePath: string,
  { priority }: { priority?: true }
): Promise<unknown> {
  if (!isPrefetchableRoute(routePath)) {
    return Promise.resolve(EMPTY_INFO)
  }

  // TODO if cache

  // TODO if known error

  // TODO use priority / pool

  const fetchPath = isDevelopment()
    ? ROUTES.routeData.replace('*', routePath)
    : [getRouteInfoRoot(), routePath, 'route-info.json'].join('/')

  return ky.get(fetchPath).json().catch(async (err) => {
    if (err instanceof HTTPError) {
      throw new FetchError(await err.response.text(), { status: err.response.status })
    }
    throw err
  })

  // TODO catch and store as error
}
