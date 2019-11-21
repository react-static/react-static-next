import { State, RoutesConfig, RouteConfig, RouteConfigList } from "../../"
import { RoutePath } from '@react-static/core'

export async function fetchRoutes(state: Readonly<State>): Promise<State> {
  if (state.config.routes) {
    console.log('Fetching routes...')

    const routes = await normaliseRoutes(state.config.routes)
    const resolvedRoutes = await Promise.all(routes.map(resolveRoute))

    console.log(`${resolvedRoutes.length} routes fetched`)

    return { ...state, data: { ...state.data, routes: resolvedRoutes } }
  }

  return state
}

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

async function resolveRoute(route: RouteConfig): Promise<unknown> {
  const resolvedData = await route.data
  if (typeof resolvedData === 'function') {
    return resolveRoute({ ...route, data: resolvedData() })
  }

  return {
    ...route,
    data: resolvedData
  }
}
