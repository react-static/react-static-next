import { PluginConfig, PluginConfigOptions, PluginsConfig, ResolvedPlugin, ResolvedPluginList, State } from '@react-static/types'
import fse from 'fs-extra'
import path from 'path'

type NormalisedPluginConfig = [string, PluginConfigOptions]
type Resolver = (state: Readonly<State>, name: string) => string

const PLUGIN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs']
const PLUGIN_BUILT_DIRECTORIES = ['dist', '.', 'src'] // TODO: remove src and only accept compiled output
const PLATFORM_PLUGIN_BASE_NAMES = ['platform.plugin', 'platform']
const APP_PLUGIN_BASE_NAMES = ['app.plugin', 'app']

const DEPRECATED_PLATFORM_PLUGIN_BASE_NAME = 'node.api'
const DEPRECATED_APP_PLUGIN_BASE_NAME = 'browser.api'

const LOOKUPS: ReadonlyArray<Resolver> = Object.freeze([
  (state: Readonly<State>, name: string): string => path.join(state.config.paths.plugins, path.normalize(name)),
  (state: Readonly<State>, name: string): string => path.join(state.config.paths.src, 'plugins', path.normalize(name)),
  (state: Readonly<State>, name: string): string => path.join(state.config.paths.nodeModules, path.normalize(name))
])

/**
 * Uses the given static.config.ext plugins definition and retrieves them:
 *
 * The order where we look-up the plugin is as follows:
 *
 * - the project (static.config.ext location) plugins directory as given
 *   by its configuration (paths) / {name}
 * - the project src directory / plugins / {name}
 * - the project node_modules / {name}
 *
 * @param rawState
 * @returns next state
 */
export async function fetchPlugins(state: Readonly<State>): Promise<State> {

  if (!state.config.plugins) {
    return state
  }

  const normalisedPlugins = await normalisePlugins(state.config.plugins)
  const plugins = normalisedPlugins.map((item) => resolvePlugin(state, item))

  return mergePluginsIntoState(state, plugins)
}

async function mergePluginsIntoState(state: Readonly<State>, plugins: ResolvedPluginList): Promise<State> {
  return { ...state, data: { ...state.data, plugins }, plugins: PlatformPlugins(plugins) }
}

async function normalisePlugins(plugins: Readonly<PluginsConfig>): Promise<NormalisedPluginConfig[]> {
  if (!plugins) {
    return []
  }

  const resolvedPlugins = await plugins
  if (typeof resolvedPlugins === 'function') {
    return normalisePlugins(resolvedPlugins())
  }

  return (resolvedPlugins as PluginConfig[]).map((item) => {
    if (typeof item === 'string') {
      return [item, {}]
    }

    return item
  })
}

class PluginNotResolved extends Error {
  constructor(public readonly name: string, resolved: ReadonlyArray<string>) {
    super(`
The plugin '${name}' could not be resolved.

Here are the paths used for lookup, in this exact order:
${resolved.map((resolution) => `- ${resolution}`).join('\n')}
    `.trim())

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Retrieves the data for the given route
 */
function resolvePlugin(state: Readonly<State>, [name, options]: NormalisedPluginConfig): ResolvedPlugin {

  for (const predicate of LOOKUPS) {
    const directory = predicate(state, name)
    // TODO: check if files are present
    if (fse.existsSync(directory)) {

      const platformPath = resolvePluginEntry(directory, PLATFORM_PLUGIN_BASE_NAMES, DEPRECATED_PLATFORM_PLUGIN_BASE_NAME)
      const appPath = resolvePluginEntry(directory, APP_PLUGIN_BASE_NAMES, DEPRECATED_APP_PLUGIN_BASE_NAME)

      console.log(`Resolved plugin '${name}'.`)

      return {
        name,
        options,
        path: directory,
        platform: platformPath,
        app: appPath
      }
    }
  }

  throw new PluginNotResolved(name, LOOKUPS.map((lookup) => lookup(state, name)))
}

function resolvePluginEntry(basePath: string, fileBases: string[], deprecatedFileBase: string): string | false {
  for (const relativeDir of PLUGIN_BUILT_DIRECTORIES) {
    for (const extension of PLUGIN_EXTENSIONS) {
      for (const fileBase of fileBases) {
        const fileName = fileBase + extension
        const filePath = path.join(basePath, relativeDir, fileName)

        if (fse.existsSync(filePath)) {
          return filePath
        }
      }
    }

    for (const extension of PLUGIN_EXTENSIONS) {
      if (fse.existsSync(path.join(basePath, relativeDir, deprecatedFileBase + extension))) {
        console.warn(`
  The plugin at "${basePath}" is not compatible with your version of
  React Static. If you're the plugin author, follow the migration guide. This
  plugin is not enabled, and the script will attempt to continue as if it's not
  present.

  The reason this warning was generated is because ${deprecatedFileBase + extension}
  exists, instead of ${fileBases.map((base) => base + extension).join(' or ')}.
        `.trim())
        return false
      }
    }
  }

  return false
}

type PluginsShape = State['plugins']

async function passThrough<T extends object>(opts: Readonly<T>): Promise<T> {
  return { ...opts }
}

function PlatformPlugins(plugins: ResolvedPluginList): PluginsShape {
  const platformPlugins = plugins.filter((plugin) => plugin.platform)

  const result: PluginsShape = {
    beforeIndexHtml: passThrough,
    beforeIndexHtmlOutput: passThrough,
    beforeWebpack: passThrough,
    afterWebpack:passThrough,
    beforeRoutes: passThrough,
    beforeRoutesResolve: passThrough,
    afterRoutes: passThrough,
    beforeSiteData: passThrough,
    afterSiteData: passThrough
  }

  return requireAndReduce(result, platformPlugins)
}

function requireAndReduce(initial: PluginsShape, plugins: ResolvedPluginList): PluginsShape {
  return plugins.reduce((result: PluginsShape, plugin: ResolvedPlugin) => {
    if (!plugin.platform) {
      // SHouldn't ever happen, because filtering happens before
      console.log(`Plugin ${plugin.name} has no platform file.`)
      return result
    }

    console.log(`Requiring ${plugin.platform}`)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let pluginExports = require(plugin.platform)

    // If callable (accepts options), pass in options
    if (typeof pluginExports === 'function') {
      pluginExports = pluginExports(plugin.options)
    }

    // Allow ES6 plugins
    if ('default' in pluginExports) {
      pluginExports = pluginExports.default

      // If callable (accepts options), pass in options
      if (typeof pluginExports === 'function') {
        pluginExports = pluginExports(plugin.options)
      }
    }

    // Allow hooks subkey
    if ('hooks' in pluginExports) {
      pluginExports = pluginExports.hooks

      // If callable (accepts options), pass in options
      if (typeof pluginExports === 'function') {
        pluginExports = pluginExports(plugin.options)
      }
    }

    // Chain them
    (Object.keys(pluginExports) as Array<keyof PluginsShape>).forEach((hookName) => {
      result = { ...result, [hookName]: chainPlugin(result[hookName], pluginExports[hookName]) }
    })

    return result
  }, initial)
}



function chainPlugin<T extends keyof PluginsShape>(current: PluginsShape[T], next: PluginsShape[T]): PluginsShape[T] {
  const chained = async (...args: Parameters<PluginsShape[T]>): Promise<unknown> => {
    const input = args[0]
    // TODO: fix the conditional type here to always know which plugin whe're talking about
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await current(input as any) as any
    return next(output)
  }

  return chained as PluginsShape[T]
}
