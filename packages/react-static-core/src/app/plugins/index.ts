import React from 'react'

type RootComponentType = React.ComponentType<{ children: React.ReactNode }>
type RoutesComponentType = React.ComponentType<{ children: React.ReactNode }>
export type Props<C> = C extends React.ComponentType<infer P> ? P : never

export type Hooks = {
  Root: (prev: RootComponentType, props: Props<RootComponentType>) => RootComponentType,
  Routes: (prev: RoutesComponentType, props: Props<RoutesComponentType>) => RoutesComponentType
}

export type Plugin = {
  hooks: Partial<Hooks>,
  plugins?: ReadonlyArray<Plugin>
}

export class PluginHooks<P extends keyof Hooks> {
  private hooks: Array<Hooks[P]>

  private constructor() {
    this.hooks = []
  }

  private register(hook: Hooks[P]): void {
    this.hooks.push(hook)
  }

  public static resolve<K extends keyof Hooks>(key: K, plugins: ReadonlyArray<Plugin>): Array<Hooks[K]> {
    const result = new PluginHooks<K>()

    // Recursively add all hooks
    const handlePlugin = (plugin: Plugin): void => {
      const hook = plugin.hooks[key]

      if (hook) {
        result.register(hook!)
      }

      if (plugin.plugins) {
        plugin.plugins.forEach(handlePlugin)
      }
    }

    // Bootstrap
    plugins.forEach(handlePlugin)

    return result.hooks
  }
}
