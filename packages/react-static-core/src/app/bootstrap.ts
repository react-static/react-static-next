import { isDevelopment } from '../universal/environment'
import { startDevelopmentSocket } from './socket'
import { ComponentType } from 'react'
// import { onReload } from './hooks/useReloadOnChange'

const current: {
  templates: Record<string, ComponentType<unknown>>,
  templateForRoute: Record<string, string>
  plugins: Record<string, any[]>
} = { templates: {}, templateForRoute: {}, plugins: {} }

export function getTemplate(path: string): ComponentType<unknown> | undefined {
  return current.templates[path]
}

/*
export function getTemplateForRoute(path: string): ComponentType<unknown> | undefined {
  const templatePath = current.templateForRoute[path]
  return templatePath ? getTemplate(templatePath) : undefined
}
*/

export function getPlugin(name: string): any[] {
  return current.plugins[name] || []
}

// When in development, init a socket to listen for data changes
// When the data changes, we invalidate and reload all of the route data
export function bootstrap(): void {

  // The following process.env.XXX values will actually be replaced with a
  // string using the Webpack Environment (Define) plugin. This means that when
  // webpac is analyzing this code to build the dependency tree, it's not
  // a "var-require".

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: plugins } = require(process.env.REACT_STATIC_PLUGINS_ARTIFACT!)
  current.plugins = plugins

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { templates, routeTemplates } = require(process.env.REACT_STATIC_TEMPLATES_ARTIFACT!)
  current.templates = templates
  current.templateForRoute = routeTemplates

  if (isDevelopment()) {
    console.debug('Passed in environment')
    console.debug({
      env: {
        REACT_STATIC_ENV: process.env.REACT_STATIC_ENV,
        NODE_ENV: process.env.NODE_ENV,
        REACT_ENV: process.env.REACT_ENV,
      },
    })

    console.debug({ plugins })
    console.debug({ templates })

    startDevelopmentSocket()
  }
  // TODO start preloader
}
