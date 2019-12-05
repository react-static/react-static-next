import { PlatformPlugin, RouteConfig } from '@react-static/types'
import { RoutePath } from '@react-static/core'
import { getFiles } from './util'

import { promises as fsPromises } from 'fs'
import path from 'path'

const { stat } = fsPromises

interface PluginOptions {
  location?: string
  overwrite?: true,
  debug?: true,
  shouldCreateRoute?(route: Readonly<RouteConfig>): boolean
  createRoute?(route: Readonly<RouteConfig>): RouteConfig
}

const DEFAULT_LOCATION = './pages'
const DEFAULT_SHOULD_CREATE_ROUTE = (route: Readonly<RouteConfig>): boolean => route.template !== undefined && /\.[mjt]sx?$/.test(route.template)
const DEFAULT_CREATE_ROUTE = (route: Readonly<RouteConfig>): RouteConfig => route

export default ({ location, debug, overwrite, shouldCreateRoute, createRoute }: PluginOptions = {}): PlatformPlugin => {

  const sourceLocation = location || DEFAULT_LOCATION

  return {
    hooks: {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      beforeRoutesResolve: async ({ state, routes, ...rest }) => {
        const sourcePath = path.join(state.config.paths.src, sourceLocation)
        const sourceStat = await stat(sourcePath)
          .then(
            (result) => {
              // Use directory if given a file
              if (result.isFile()) {
                state.logger.warn(`
Expected the "location" of @react-static/plugin-source-filesystem to be a
directory, but "${sourceLocation}" is a file. Using the container directory
instead. Change the value to a directory to remove this warning.
                `.trim())
                return path.dirname(sourcePath)
              }

              return sourcePath
            },
            (err) => {
              state.logger.warn(`
Tried to access the "location" given to @react-static/plugin-source-filesystem,
but "${sourceLocation}" yielded the following error:

  ${'message' in err ? err.message : err}

This plugin is ignored. Fix the error above to remove this warning and enable
the plugin. You might need to restart the development server or build.
              `)
              return false
            }
          )

        // Bail out because the location directory was not available
        if (typeof sourceStat === 'boolean') {
          return { state, routes, ...rest }
        }

        if (path.relative(state.config.paths.src, sourceStat).includes('..')) {
          state.logger.warn(`
The "location" given to @react-static/plugin-source-filesystem is outside of
the configured "src" path (${state.config.paths.src}). Because React Static
does not want to leak the full path to the output bundle, the "location" MUST
be inside the "src" path.

Change the location "${sourceLocation}" to be inside the "src" path to make
this warning disappear, and enable this plugin.
          `.trim())

          return { state, routes, ...rest }
        }

        const files = await getFiles(sourceStat)

        if (debug) {
          state.logger.debug(`@react-static/plugin-source-filesystem: Got ${files.length} entries in ${sourceStat}.`)
        }

        const additionalRoutes = files
          .map((file): RouteConfig => {
            const noExt = path.join(
              path.dirname(file),
              path.basename(file, path.extname(file))
            )


            const route = {
              // The path is the relative path from the input directory
              path: RoutePath.normalize(
                path.relative(sourceStat, noExt)
                  // ...but use url slashes (important when on Windows-like systems).
                  .replace(/\\/g, "/")
              ),
              // The file itself is its own template
              template: path.relative(state.config.paths.root, file)
                .replace(/\\/g, "/")
            }

            if (debug) {
              state.logger.debug('@react-static/plugin-source-filesystem', route)
            }

            return route
          })
          .filter(shouldCreateRoute || DEFAULT_SHOULD_CREATE_ROUTE)
          .map(createRoute || DEFAULT_CREATE_ROUTE)

        if (debug) {
          state.logger.debug(`@react-static/plugin-source-filesystem: Creating ${additionalRoutes.length} routes.`)
        }

        // Should these routes overwrite known routes, or should known routes
        // overwrite these routes? By default, known routes should overwrite
        // these routes.
        const nextRoutes = overwrite === true
          ? routes.concat(additionalRoutes)
          : additionalRoutes.concat(routes)

        return { state, routes: nextRoutes, ...rest }
      }
    }
  }
}
