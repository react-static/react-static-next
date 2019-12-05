import { RoutePath } from '@react-static/core'
import { State, RoutesConfig, RouteConfig, RouteConfigList, ResolvedRouteList } from '@react-static/types'

/**
 * Uses the given static.config.ext routes definition & fetches all the routes:
 *
 * 1. It normalises all the routes by ensuring it's a single, flat, array of
 *    Route objects. This means that each async item is resolved, and each
 *    child is evaluated.
 *
 * 2. Each Route is resolved, which means that its "data" is retrieved.
 *
 * @param rawState
 * @returns next state
 */
export async function fetchRoutes(rawState: Readonly<State>): Promise<State> {

  const state = await runBeforeState(rawState)

  if (!state.config.routes) {
    const pluginNames = state.data.plugins.map(({ name }) => name).join(', ')
    state.logger.warn(`
There are no routes to normalise or resolve. This is probably a mistake. Make
sure that there is at least one route in the "routes" list in your static
configuration file (static.config.ext) or that there is at least one plugin
that generates at least one route.

The plugins currently loaded are: ${pluginNames}.
`.trim())
    return state
  }

  state.logger.log('fetchRoutes: Fetching routes...')

  const normalisedRoutes = await normaliseRoutes(state.config.routes)

  const nextState = await runBeforeResolve(state, normalisedRoutes)
    .then(({ routes, state }) => Promise.all(routes.map(resolveRoute)).then((routes) => ({ routes, state })))
    .then(({ routes, state }) => runBeforeMerge(state, routes))
    .then(({ routes, state }) => mergeRoutesIntoState(state, routes))

  state.logger.log(`fetchRoutes: ${nextState.data.routes.length} routes fetched`)

  return nextState
}

async function runBeforeState(state: Readonly<State>): Promise<State> {
  return (await state.plugins.beforeRoutes({ state })).state
}

async function runBeforeResolve(state: Readonly<State>, routes: RouteConfigList): Promise<{ state: State, routes: RouteConfigList }> {
  return (await state.plugins.beforeRoutesResolve({ state, routes }))
}

async function runBeforeMerge(state: Readonly<State>, routes: ResolvedRouteList): Promise<{ state: State, routes: ResolvedRouteList }> {
  return (await state.plugins.afterRoutes({ state, routes }))
}

async function mergeRoutesIntoState(state: Readonly<State>, routes: ResolvedRouteList): Promise<State> {
  return { ...state, data: { ...state.data, routes } }
}

/**
 * It normalises all the routes by ensuring it's a single, flat, array of Route
 * objects. This means that each async item is resolved, and each child is
 * evaluated.
 *
 * This is recursively called, with the prefix being the path prefix.
 *
 * @param routes
 * @param prefix
 */
async function normaliseRoutes(routes?: Readonly<RoutesConfig>, prefix = ''): Promise<RouteConfigList> {
  if (!routes) {
    return []
  }

  const resolvedRoutes = await routes
  if (typeof resolvedRoutes === 'function') {
    return normaliseRoutes(resolvedRoutes(), prefix)
  }

  const mapped = await Promise.all((resolvedRoutes as RouteConfig[]).map(async (item) => {
    const parentPath = RoutePath.normalize(prefix + RoutePath.normalize(item.path))
    return [{ path: parentPath, template: item.template, data: item.data || item.getData }, ...(await normaliseRoutes(item.children, parentPath))]
  }))

  return mapped.flat(2)
}

/**
 * Retrieves the data for the given route
 */
async function resolveRoute(route: RouteConfig): Promise<{ path: string, data: unknown }> {
  const resolvedData = await route.data
  if (typeof resolvedData === 'function') {
    return resolveRoute({ ...route, data: resolvedData() })
  }

  return {
    ...route,
    data: resolvedData
  }
}
