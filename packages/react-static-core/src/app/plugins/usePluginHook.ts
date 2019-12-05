import { StaticRoutesFunction, StaticRoutesProps } from '@react-static/types'
import { ComponentType, createElement, ReactNode, useCallback } from 'react'
import { getPlugin } from '../bootstrap'
import { StaticInfoContext } from '../contexts/StaticInfoContext'

export interface StaticRootProps {
  children: ReactNode
}

export function useStaticRoot<T extends object = {}>(): ComponentType<StaticRootProps & T> {
  const roots = getPlugin('StaticRoot')

  return useCallback(({ children, ...rest }: StaticRootProps & T): JSX.Element => {
    const FinalRoot = roots.reduce(
      (result, root) => root(result),

      // This is the final, enclosing, top-level, default Static Root, which
      // sets up the correct contexts, etc.
      InitialStaticRoot
    )

    return createElement(FinalRoot, rest, children)
  }, [roots])
}

function InitialStaticRoot({ children }: StaticRootProps): JSX.Element {
  return createElement(StaticInfoContext.Provider, undefined, [
    createElement('h1', { key: 'header' }, 'Static Root'),
    createElement('div', { key: 'children' }, children)
  ])
}

type GivenRenderFn = StaticRoutesFunction | null | undefined

export function useStaticRoutes<T extends object = {}>(props: StaticRoutesProps & T): GivenRenderFn {
  const routes: Array<(previous: GivenRenderFn) => GivenRenderFn> = getPlugin('StaticRoutes')
  const makeFinal = useCallback((props: StaticRoutesProps & T): GivenRenderFn  => {
    return routes.reduce(
      (result: GivenRenderFn, current: (previous: GivenRenderFn) => GivenRenderFn) => current(result), props.render
    )
  }, [routes])

  return makeFinal(props)
}
