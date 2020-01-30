/* eslint-disable import/no-dynamic-require, react/no-danger, import/no-mutable-exports */
import chalk from 'chalk'
import { Application, Request, Response, NextFunction } from 'express'
import webpack, { Configuration, Compiler, Stats } from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

import { findAvailablePorts } from './findAvailablePorts'
import { createWebpackConfig } from './createWebpackConfig'
import { runMessageServer, MessageEmitters } from './runMessageServer'

import { ROUTES, ROUTE_PREFIX, RoutePath, isDevelopment } from '@react-static/core'
import { State, StateWithActions } from '@react-static/types'

// Using a require here so that typescript does not include it in its
// compilation group, which will require the file to be under the rootDir(s),
// forcing the layout of dist to include the sub-folder src/
//
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json')

const WEBPACK_HOOK_NAME = `react-static@${version}`
const DEFAULT_DEV_SERVER_PORT = 4000
const DEFAULT_DEV_SERVER_HOST = 'localhost'
const PROCESS_REF: { current?: WebpackDevServer } = { current: undefined }
const EMITTER_REF: { current?: MessageEmitters } = { current: undefined }

interface RunDevServerOptions {
  config: Configuration
}

class RouteMissingError extends Error {
  constructor(routePath: string) {
    super(
      `
Route could not be found for: ${routePath}

If you removed this route, disregard this error.
If this is a dynamic route, consider adding it to the prefetchExcludes list:

import { PrefetchExclusions } from '@react-static/core'
PrefetchExclusions.add('${routePath}')
    `.trim() + '\n'
    )

    this.name = 'RouteMissingError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Starts the development server for react static which allows for in-memory
 * webpack bundling (and all its plugins such as babel transpilation), as well
 * as HMR/live reload.
 *
 * It also serves some development routes so that route data, site data, and
 * other normally static resources can be changed on the fly, without the need
 * for pre-rendering.
 *
 * The server address is logged and there is a HELP entry point, by default
 * at its root: /__react-static-server__/:react-static-version:
 *
 * @param state
 * @param options
 */
export async function runDevServer(
  state: Readonly<State>,
  options: RunDevServerOptions
): Promise<StateWithActions> {
  // This node process already has a registered dev server. This can happen
  // when this task is run again for example by a file-watcher invocation. In
  // that case, instead of starting a new dev server, send a reload message.
  if (PROCESS_REF.current) {
    // Build dev routes?
    state.logger.info('TODO: build dev routes, reloading emitter ref')
    // Send a reload to the client
    EMITTER_REF.current && EMITTER_REF.current.reload()

    return {
      ...state,
      ...EMITTER_REF.current!,
      restart: (): void => {
        runDevServer(state, options)
      }
    }
  }

  return startDevServer(state, options)
}

async function withHostAndPort(
  state: Readonly<State>,
  config: RunDevServerOptions['config']
): Promise<{ messagePort: number; config: RunDevServerOptions['config'] }> {
  const intendedPort = Number(
    (config && config.devServer && config.devServer.port) ||
    DEFAULT_DEV_SERVER_PORT
  )
  const [port, messagePort] = await findAvailablePorts(intendedPort, 2)

  if (intendedPort !== port) {
    state.logger.warn(
      chalk`{red Warning!} Port {yellowBright ${intendedPort +
        ''}} is not available. Using port {green ${port + ''}} instead!`
    )
  }

  const shouldEnableHmr = isDevelopment()

  return {
    messagePort,
    config: {
      ...config,

      devServer: {
        contentBase: state.config.paths.dist.root,
        compress: true,
        hot: shouldEnableHmr,
        hotOnly: shouldEnableHmr,
        host: DEFAULT_DEV_SERVER_HOST,
        ...config.devServer,
        port,
      },
    },
  }
}

async function startDevServer(
  state: Readonly<State>,
  options: RunDevServerOptions,
): Promise<StateWithActions> {
  const { config, messagePort } = await withHostAndPort(state, options.config)
  const devConfig = await createWebpackConfig(config, state)
  const devCompiler = webpack(devConfig)

  const devServerConfig: WebpackDevServer.Configuration = {
    open: !process.env.CI || process.env.CI === 'false',
    /*contentBase: [],
        publicPath: '/',
        historyApiFallback: true,
        compress: false,
        clientLogLevel: 'warning',
        overlay: true,
        stats: 'errors-only',
        noInfo: true,*/
    ...devConfig.devServer,
    before: buildDevBefore(state, devConfig, { messagePort }),
    /*
        hotOnly: true,
        watchOptions: {
          ...(state.config.devServer
            ? state.config.devServer.watchOptions || {}
            : {}),
          ignored: [
            /node_modules/,

            ...((state.config.devServer.watchOptions || {}).ignored || []),
          ],
        },
        */
  }

  state.logger.info(`Starting server (${WEBPACK_HOOK_NAME}: ${ROUTE_PREFIX})`)
  // time(chalk.green('[\u2713] Application Bundled'))

  addHook(devCompiler.hooks.invalid, hookOnBundleInvalidated(state))
  addHook(devCompiler.hooks.done, hookOnBundleDone(state))

  addHookOnce(devCompiler.hooks.done, hookOnBundleDoneFirstTime(state, devConfig))

  // TODO: remove this line
  state.logger.debug(JSON.stringify(devServerConfig, undefined, 2) + '\n')

  // Start the webpack dev server.
  const devServer = (PROCESS_REF.current = new WebpackDevServer(
    devCompiler,
    devServerConfig
  ))

  await new Promise((resolve, reject) => {
    devServer.listen(devServerConfig.port!, devServerConfig.host!, (err) => {
      if (err) {
        state.logger.error(
          `Listening on ${devServerConfig.host}:${devServerConfig.host} failed: ${err}`
        )
        return reject(err)
      }

      resolve()
    })
  })

  EMITTER_REF.current = await runMessageServer({ messagePort })

  /*
    console.log('Running plugins...')
    state = await plugins.afterDevServerStart(state)

    return state
    */

  return {
    ...state,
    ...EMITTER_REF.current!,
    restart: (): void => {
      runDevServer(state, options)
    }
  }
}

/**
 * Async route middleware wraps a route function and ensures its returned
 * Promise is always correctly handled.
 *
 * Note: If you want to give a response on an error, this should be handled
 *       inside the route function. This middleware merely called next when
 *       an error occurs, which means that it will be "unhandled".
 *
 * @param fn the async route function
 * @returns the route function (with async handled)
 */
function asyncRoute<T extends { [key: string]: string }>(
  fn: (req: Request<T>, res: Response, next: NextFunction) => Promise<void>
): (req: Request<T>, res: Response, next: NextFunction) => void {
  return (req, res, next): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Create "before" hook for the webpack-dev-server, which registers various
 * routes for the @react-static eco-system to use during development (that is
 * development of a project using @react-static/scripts, not development of
 * the library).
 *
 * @param options
 * @param messagePort
 */
function buildDevBefore(
  state: Readonly<State>,
  options: RunDevServerOptions['config'],
  { messagePort }: { messagePort: number }
): WebpackDevServer.Configuration['before'] {
  return (app, server, compiler): Application => {
    const routesMap: Record<string, string> = {}

    // latestState = await fetchSiteData(newState)

    app.get(
      ROUTES.queryMessagePort,
      asyncRoute(async (_, res) => {
        state.logger.info(chalk`{yellowBright GET} {greenBright ${ROUTES.queryMessagePort}}`)
        res.send({ port: messagePort })
      })
    )

    routesMap[ROUTES.queryMessagePort] =
      'Query the message port for the react-static development message server.'

    // The site data handler serves the static global site data. After build or
    // export, this data lives in a static file, but this route allows us to
    // serve updated data if its contents are changed during development.
    app.get(
      ROUTES.siteData,
      asyncRoute(async (_, res, next) => {
        state.logger.debug(chalk`{yellowBright GET} {greenBright ${ROUTES.siteData}}`)

        try {
          res.send({ dev: 'some-site-data',  ...(state.data.site as object || {}) })
        } catch (err) {
          res.status(500)
          res.send(err)
          next(err)
        }
      })
    )

    routesMap[ROUTES.siteData] =
      'Get the static site data, normally provided by a flat file.'

    //latestState.routes.forEach(({ path: routePath }) => {

    // The route data handler serves the route data (route info) for a route.
    // After build or export, this data lives in a static file in the route
    // folder, but defining it here allows us to serve updated data if it's
    // contents are changed during development.

    app.get<{ 0: string }>(
      ROUTES.routeData,
      asyncRoute(async (req: Request<{ 0: string }>, res) => {
        const { 0: routePath } = req.params

        const normalized = RoutePath.normalize(routePath)
        state.logger.debug(state.data)
        const lookup = state.data.routes.find((route) => route && (route as { path: string }).path === normalized)

        state.logger.debug(chalk`{yellowBright GET} {greenBright ${ROUTES.routeData}} with "${normalized}"`)

        // TODO: find route
        const route = normalized !== '/missing' && lookup

        if (!route) {
          const error = new RouteMissingError(normalized)
          res.status(404)
          throw error
        }

        console.log("data", lookup)

        //const routeData = await getRouteData(route, latestState)
        res.json({
          ___dev: { routePath: normalized, params: JSON.stringify(req.params) },

          data: (lookup || { data: {} }).data,
          template: (lookup || { template: null }).template
        })
      })
    )

    routesMap[ROUTES.routeData] =
      'Get route specific data, normally provided by a flat file.'

    // Show the routes that have been registered
    app.get(
      ROUTES.help,
      asyncRoute(async (_, res) => {
        res.status(200).json(routesMap)
      })
    )

    // Run any custom hooks
    if (options.devServer && options.devServer.before) {
      options.devServer.before(app, server, compiler)
    }

    // The dev-server error handler
    app.use(function (
      err: Error,
      _: Request,
      res: Response,
      next: NextFunction
    ) {
      if (res.headersSent) {
        return next(err)
      }

      res
        .status(res.statusCode || 500)
        .header('Content-Type', 'text/plain')
        .send(`${err.name}: ${err.message}`)
    })

    return app
  }
}

type Hooks = keyof Compiler['hooks']
type HookType<T extends Hooks> = Compiler['hooks'][T]
type TapFunction<T extends Hooks> = Parameters<HookType<T>['tap']>[1]

function addHook<T extends Hooks>(
  hooks: Compiler['hooks'][T],
  hook: TapFunction<T>
): void {
  hooks.tap(WEBPACK_HOOK_NAME, hook)
}

function addHookOnce<T extends Hooks>(
  hooks: Compiler['hooks'][T],
  hook: TapFunction<T>
): void {
  let hasRun = false

  addHook(hooks, (...args: [unknown, unknown, unknown]) => {
    if (hasRun) {
      return
    }

    hook(...args)
    hasRun = true
  })
}

type InvalidatedHook = Parameters<Compiler['hooks']['invalid']['tap']>[1]
type DoneHook = Parameters<Compiler['hooks']['done']['tap']>[1]

function hookOnBundleInvalidated(state: Readonly<State>): InvalidatedHook {
  return (fileName: string, changeTime: Date): void => {
    state.logger.log('\nFile changed:', chalk.greenBright(fileName))
  }
}

function hookOnBundleDoneFirstTime(state: Readonly<State>, config: Configuration): DoneHook {
  return (stats: Stats): void => {
    state.logger.info(
      `${chalk.green('[\u2713] DevServer running at')} ${chalk.blue(
        `http://${config!.devServer!.host}:${config!.devServer!.port}`
      )}`
    )
  }
}

function hookOnBundleDone(state: Readonly<State>): DoneHook {
  return (stats: Stats): void => {
    const messages = stats.toJson({}, true)

    const isSuccessful = !messages.errors.length
    const hasWarnings = messages.warnings.length

    if (!isSuccessful) {
      state.logger.warn(chalk.red('[\u274C] Application bundling failed'))
      state.logger.error(chalk.red(messages.errors.join('\n')))
      state.logger.warn(chalk.yellowBright(messages.warnings.join('\n')))
      return
    }

    if (!hasWarnings) {
      return
    }

    state.logger.info(
      chalk.yellowBright(
        `\n[\u0021] There were ${messages.warnings.length} warnings during compilation\n`
      )
    )
    messages.warnings.forEach((message, index) => {
      state.logger.warn(`[warning ${index}]: ${message}`)
    })
  }
}
