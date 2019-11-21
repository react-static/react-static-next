/* eslint-disable import/no-dynamic-require, react/no-danger, import/no-mutable-exports */
import chalk from 'chalk'
import { Application, Request, Response, NextFunction } from 'express'
import path from 'path'
import webpack, { Configuration, Compiler, Stats } from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

import { findAvailablePorts } from './findAvailablePorts'
import { createWebpackConfig } from './createWebpackConfig'
import { runMessageServer, MessageEmitters } from './runMessageServer'

import { ROUTES, ROUTE_PREFIX } from '../routes'
import { version } from '../../package.json'
import { State, StateWithActions } from '../..'

const WEBPACK_HOOK_NAME = `react-static@${version}`
const DEFAULT_DEV_SERVER_PORT = 8300
const DEFAULT_DEV_SERVER_HOST = 'localhost'
const PROCESS_REF: { current?: WebpackDevServer } = { current: undefined }
const EMITTER_REF: { current?: MessageEmitters } = { current: undefined }

interface RunDevServerOptions {
  state: State
  config: Configuration
}

class RouteMissingError extends Error {
  constructor(routePath: string) {
    super(
      `
Route could not be found for: ${routePath}

If you removed this route, disregard this error.
If this is a dynamic route, consider adding it to the prefetchExcludes list:

addPrefetchExcludes(['${routePath}'])
    `.trim()
    )

    Error.captureStackTrace(this, this.constructor)
  }
}

export async function runDevServer(
  options: RunDevServerOptions
): Promise<StateWithActions> {
  // This node process already has a registered dev server. This can happen
  // when this task is run again for example by a file-watcher invocation. In
  // that case, instead of starting a new dev server, send a reload message.
  if (PROCESS_REF.current) {
    // Build dev routes?
    console.log('TODO: build dev routes')
    // Send a reload to the client
    EMITTER_REF.current && EMITTER_REF.current.reload()
    return { ...options.state, ...EMITTER_REF.current! }
  }

  return startDevServer(options)
}

async function withHostAndPort(
  config: RunDevServerOptions['config']
): Promise<{ messagePort: number; config: RunDevServerOptions['config'] }> {
  const intendedPort = Number(
    (config && config.devServer && config.devServer.port) ||
      DEFAULT_DEV_SERVER_PORT
  )
  const [port, messagePort] = await findAvailablePorts(intendedPort, 2)

  if (intendedPort !== port) {
    console.log(
      chalk`{red Warning!} Port {yellowBright ${intendedPort +
        ''}} is not available. Using port {green ${port + ''}} instead!`
    )
  }

  return {
    messagePort,
    config: {
      ...config,
      devServer: {
        contentBase: path.join(process.cwd(), 'dist'),
        compress: true,
        hot: true,
        hotOnly: true,
        host: DEFAULT_DEV_SERVER_HOST,
        ...config.devServer,
        port,
      },
    },
  }
}

async function startDevServer(
  options: RunDevServerOptions
): Promise<StateWithActions> {
  const { config, messagePort } = await withHostAndPort(options.config)
  const devConfig = createWebpackConfig(config, options.state)
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
    before: buildDevBefore(devConfig, { messagePort }),
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

  console.log(`Starting server (${WEBPACK_HOOK_NAME}: ${ROUTE_PREFIX})`)
  // time(chalk.green('[\u2713] Application Bundled'))

  addHook(devCompiler.hooks.invalid, hookOnBundleInvalidated())
  addHook(devCompiler.hooks.done, hookOnBundleDone())

  addHookOnce(devCompiler.hooks.done, hookOnBundleDoneFirstTime(devConfig))

  // TODO: remove this line
  console.log(JSON.stringify(devServerConfig, undefined, 2) + '\n')

  // Start the webpack dev server.
  const devServer = (PROCESS_REF.current = new WebpackDevServer(
    devCompiler,
    devServerConfig
  ))

  await new Promise((resolve, reject) => {
    devServer.listen(devServerConfig.port!, devServerConfig.host!, (err) => {
      if (err) {
        console.error(
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

  return { ...options.state, ...EMITTER_REF.current! }
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
  options: RunDevServerOptions['config'],
  { messagePort }: { messagePort: number }
): WebpackDevServer.Configuration['before'] {
  return (app, server, compiler): Application => {
    const routesMap: Record<string, string> = {}

    // latestState = await fetchSiteData(newState)

    app.get(
      ROUTES.queryMessagePort,
      asyncRoute(async (_, res) => {
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
        try {
          res.send({ dev: 'some-site-data' })
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

        // TODO: find route
        const route = routePath !== 'missing'

        if (!route) {
          const error = new RouteMissingError(routePath)
          res.status(404)
          throw error
        }

        //const routeData = await getRouteData(route, latestState)
        res.json({ dev: { routePath, params: JSON.stringify(req.params) } })
      })
    )

    routesMap[ROUTES.routeData] =
      'Get route specific data, normally provided by a flat file.'

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

function hookOnBundleInvalidated(): InvalidatedHook {
  return (fileName: string, changeTime: Date): void => {
    console.log('\nFile changed:', chalk.greenBright(fileName))
  }
}

function hookOnBundleDoneFirstTime(config: Configuration): DoneHook {
  return (stats: Stats): void => {
    console.log(
      `${chalk.green('[\u2713] DevServer running at')} ${chalk.blue(
        `http://${config!.devServer!.host}:${config!.devServer!.port}`
      )}`
    )
  }
}

function hookOnBundleDone(): DoneHook {
  return (stats: Stats): void => {
    const messages = stats.toJson({}, true)

    const isSuccessful = !messages.errors.length
    const hasWarnings = messages.warnings.length

    if (!isSuccessful) {
      console.log(chalk.red('[\u274C] Application bundling failed'))
      console.error(chalk.red(messages.errors.join('\n')))
      console.warn(chalk.yellowBright(messages.warnings.join('\n')))
      return
    }

    if (!hasWarnings) {
      return
    }

    console.log(
      chalk.yellowBright(
        `\n[\u0021] There were ${messages.warnings.length} warnings during compilation\n`
      )
    )
    messages.warnings.forEach((message, index) => {
      console.warn(`[warning ${index}]: ${message}`)
    })
  }
}
