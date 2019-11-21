import React from 'react'

export type CompChildrenProp = {
  children: React.ReactNode
}

export interface State {
  stage: 'dev'
  config: PlatformConfig
  data: {
    site: unknown
    routes: unknown[]
  }
  subscription?: Subscription
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

  /**
   * @deprecated use AppConfig['routes'] instead
   */
  getRoutes?: AppConfig['routes']

  /**
   * @deprecated use AppConfig['data'] instead
   */
  getData?: AppConfig['data']
}

export type ConfigCallback = (state: State) => void
