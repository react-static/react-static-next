import React from 'react'

export type CompChildrenProp = {
  children: React.ReactNode
}

/**
 * Used when running a development server (watch mode)
 */
type DevStage = 'dev'

/**
 * Used when building a production bundle
 */
type BuildStage = 'build'

/**
 * Used when pre-rendering all routes and generating a static site
 */
type ExportStage = 'export'

export type Stage = DevStage | BuildStage | ExportStage

export interface State {
  // Current stage / mode
  stage: Stage
  // Normalised AppConfig
  config: PlatformConfig
  // Extracted data from the configuration
  data: {
    site: unknown
    routes: ResolvedRouteList
    plugins: ResolvedPluginList
  }
  // Watch subscription to reload or rebuild / restart
  subscription?: Subscription
  // Holds the plugin chains
  plugins: PlatformPlugins
}

interface Actions {
  reload(): void
}

export type StateWithActions = State & Actions

export interface Subscription {
  (): void
}

/**
 * This is the shape of the configuration once it has been processed by the
 * react-static-scripts CLI. It's this object that is passed around
 * internally, and extends the user-provided AppConfig.
 *
 * @see AppConfig
 */
export interface PlatformConfig {
  html: {
    Document?: React.ComponentType<
      {
        Html: NonNullable<PlatformConfig['html']['Html']>
        Head: NonNullable<PlatformConfig['html']['Head']>
        Body: NonNullable<PlatformConfig['html']['Body']>
        state: Readonly<State>
      } & CompChildrenProp
    >
    Html?: React.ComponentType<CompChildrenProp>
    Head?: React.ComponentType<CompChildrenProp>
    Body?: React.ComponentType<CompChildrenProp>
  }
  paths: {
    root: string
    src: string
    dist: {
      root: string
      assets: string
      html: string
    }
    temp: string
    artifacts: string
    public: string
    plugins: string
    nodeModules: string
  }
  plugins: PluginsConfig
  data: DataConfig
  routes: RoutesConfig
  siteRoot: string | Promise<string> | ((state: Readonly<State>) => string) | ((state: Readonly<State>) => Promise<string>) | undefined
}

export type RoutesConfig =
  | RouteConfigList
  | RouteConfigsPromise
  | SyncRoutesConfig
  | AsyncRoutesConfig

export type RouteConfigList = RouteConfig[]
export type RouteConfigsPromise = Promise<RouteConfigList>
export type SyncRoutesConfig = () => RouteConfigList
export type AsyncRoutesConfig = () => RouteConfigsPromise

export type PluginsConfig =
  | PluginConfigList
  | PluginConfigsPromise
  | SyncPluginsConfig
  | AsyncPluginsConfig

export type PluginConfigList = PluginConfig[]
export type PluginConfigsPromise = Promise<PluginConfigList>
export type SyncPluginsConfig = () => PluginConfigList
export type AsyncPluginsConfig = () => PluginConfigsPromise

export type DataConfig = unknown | (() => unknown) | AsyncDataConfig

export type AsyncDataConfig = () => Promise<unknown>

export type RouteConfig = {
  path: string
  template?: string
  data?: DataConfig
  children?: RoutesConfig

  /**
   * @deprecated use RouteConfig['data'] instead
   */
  getData?: RouteConfig['data']
}

export type ResolvedRouteList = Array<{
  path: string
  template?: string
  data: unknown
}>

export type ResolvedPlugin = {
  name: string
  path: string
  options: object
  platform: string | false
  app: string | false
}

export type ResolvedPluginList = ResolvedPlugin[]

export type PluginConfig = string | [string, PluginConfigOptions]

export type PluginConfigOptions = Record<string, unknown>

/**
 * This denotes the shape of the static.config object default export. It will,
 * through multiple steps, be converted to a PlatformConfig.
 *
 * @see PlatformConfig
 *
 */
export interface AppConfig {
  components?: Partial<PlatformConfig['html']>
  paths?: Partial<PlatformConfig['paths'] & { dist: string }>
  plugins?: PlatformConfig['plugins']
  routes?: PlatformConfig['routes']
  data?: PlatformConfig['data']
  siteRoot?: PlatformConfig['siteRoot']

  /**
   * @deprecated use AppConfig['routes'] instead
   */
  getRoutes?: AppConfig['routes']

  /**
   * @deprecated use AppConfig['data'] instead
   */
  getData?: AppConfig['data']

   /**
   * @deprecated use AppConfig['data'] instead
   */
  siteData?: PlatformConfig['data']

   /**
   * @deprecated use AppConfig['data'] instead
   */
  getSiteData?: AppConfig['data']
}

export type ConfigCallback = (state: State) => void

type PluginHook<T extends object> = ((opts: Readonly<T>) => T) | ((opts: Readonly<T>) => Promise<T>)

/**
 * Runs before state is read when creating the index.html file
 */
export type IndexHtmlGetStateHook = PluginHook<{ state: State }>

/**
 * Runs before the generated html is output to disk
 */
export type IndexHtmlOutputHook = PluginHook<{ state: State, html: string }>

/**
 * Runs before state is read when generating the webpack configuration
 */
export type WebpackGetStateHook = PluginHook<{ state: State, config: import('webpack').Configuration }>

/**
 * Runs before the generated webpack configuration is used
 */
export type WebpackBeforeUseHook = PluginHook<{ state: State, config: import('webpack').Configuration }>

/**
 * Runs before state is read when fetching the routes
 */
export type RoutesGetStateHook = PluginHook<{ state: State }>

/**
 * Runs before resolving all the data for all the routes
 */
export type RoutesBeforeResolveHook = PluginHook<{ state: State, routes: RouteConfigList }>

/**
 * Runs before storing all the data and routes for use in the eco-system (before use)
 */
export type RoutesBeforeMergeHook = PluginHook<{ state: State, routes: ResolvedRouteList }>

export type SiteDataGetStateHook = PluginHook<{ state: State }>

export type SiteDataBeforeMergeHook = PluginHook<{ state: State, site: unknown }>

export type PlatformPlugins = PlatformPluginHooks
export type PlatformPluginHooks = {
  beforeIndexHtml: IndexHtmlGetStateHook
  beforeIndexHtmlOutput: IndexHtmlOutputHook
  beforeWebpack: WebpackGetStateHook
  afterWebpack: WebpackBeforeUseHook
  beforeRoutes: RoutesGetStateHook
  beforeRoutesResolve: RoutesBeforeResolveHook
  afterRoutes: RoutesBeforeMergeHook
  beforeSiteData: SiteDataGetStateHook
  afterSiteData: SiteDataBeforeMergeHook
}

export type AppPlatformPlugin<T extends object = {}> = PlatformPluginFactory<T> | PlatformPlugin
export type PlatformPluginFactory<T extends object = {}> = (options: T) => PlatformPlugin
export type PlatformPlugin = { hooks: Partial<PlatformPluginHooks> } | Partial<PlatformPluginHooks>
