const version = require('../package.json')['version']
export const ROUTE_PREFIX = `/__react-static-server__/${version}`

export const ROUTES = Object.freeze({
  help: ROUTE_PREFIX,
  queryMessagePort: `${ROUTE_PREFIX}/message-port`,
  siteData: `${ROUTE_PREFIX}/site`,
  routeData: `${ROUTE_PREFIX}/route/*`,
})
