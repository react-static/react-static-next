import { PlatformPlugin, PlatformPluginHooks } from '@react-static/types'

interface PluginOptions {
  include?: Array<keyof PlatformPluginHooks>
  exclude?: Array<keyof PlatformPluginHooks>
}

export default ({ include, exclude }: PluginOptions = {}): PlatformPlugin => {
  const defaultLoggingHooks: PlatformPlugin = {
    beforeSiteData: (opts) => {
      console.log('@react-static/logging: beforeSiteData');
      return opts
    },
    afterSiteData: (opts) => {
      console.log('@react-static/logging: afterSiteData');
      return opts
    },
    beforeRoutes: (opts) => {
      console.log('@react-static/logging: beforeRoutes');
      return opts
    },
    beforeRoutesResolve: (opts) => {
      console.log('@react-static/logging: beforeRoutesResolve');
      return opts
    },
    afterRoutes: (opts) => {
      console.log('@react-static/logging: afterRoutes');
      return opts
    },
    beforeIndexHtml: (opts) => {
      console.log('@react-static/logging: beforeIndexHtml');
      return opts
    },
    beforeIndexHtmlOutput: (opts) => {
      console.log('@react-static/logging: beforeIndexHtmlOutput');
      return opts
    },
    beforeWebpack: (opts) => {
      console.log('@react-static/logging: beforeWebpack');
      return opts
    },
    afterWebpack: (opts) => {
      console.log('@react-static/logging: afterWebpack');
      return opts
    },
  }

  if (include && include.length > 0) {
    // Only include those hooks that are given (whitelist)
    return include.reduce((result, name) => {
      if (defaultLoggingHooks[name]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result[name] = defaultLoggingHooks[name] as any
      }

      return result
    }, defaultLoggingHooks)
  }

  if (exclude) {
    exclude.forEach((name) => {
      delete defaultLoggingHooks[name]
    })
  }

  return {
    hooks: defaultLoggingHooks
  }
}
