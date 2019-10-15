import { useMemo } from 'react'
import { Hooks, PluginHooks, Props } from './index'

export function usePluginHook<K extends keyof Hooks>(id: K, args: Props<ReturnType<Hooks[K]>>): ReturnType<Hooks[K]> {
  return useMemo(() => {
    const hooks = PluginHooks.resolve(id, [])
    const reduced = hooks.reduce(
      (prev, hook): ReturnType<Hooks[K]> => hook(prev, args) as ReturnType<Hooks[K]>,
      (({ children }) => children) as ReturnType<Hooks[K]>
    )
    return reduced
  }, [id])
}
