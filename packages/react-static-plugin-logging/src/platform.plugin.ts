import { PlatformPlugin, PlatformPluginHooks } from '@react-static/types'

interface PluginOptions {
  include?: Array<keyof PlatformPluginHooks>
  exclude?: Array<keyof PlatformPluginHooks>
}

export default ({ include, exclude }: PluginOptions = {}): PlatformPlugin => {

  const defaultLoggingHooks: PlatformPlugin = {
    beforeSiteData: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeSiteData');
      return opts
    },
    afterSiteData: (opts) => {
      opts.state.logger.log('@react-static/logging: afterSiteData');
      return opts
    },
    beforeRoutes: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeRoutes');
      return opts
    },
    beforeRoutesResolve: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeRoutesResolve');
      return opts
    },
    afterRoutes: (opts) => {
      opts.state.logger.log('@react-static/logging: afterRoutes');
      return opts
    },
    beforeDirectories: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeDirectories');
      return opts
    },
    afterDirectories: (opts) => {
      opts.state.logger.log('@react-static/logging: afterDirectories');
      return opts
    },
    beforePluginArtifacts: (opts) => {
      opts.state.logger.log('@react-static/logging: beforePluginArtifacts');
      return opts
    },
    beforePluginArtifactsOutput: (opts) => {
      opts.state.logger.log('@react-static/logging: beforePluginArtifactsOutput');
      return opts
    },
    beforeTemplateArtifacts: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeTemplateArtifacts');
      return opts
    },
    beforeTemplateArtifactsOutput: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeTemplateArtifactsOutput');
      return opts
    },
    beforeIndexHtml: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeIndexHtml');
      return opts
    },
    beforeIndexHtmlOutput: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeIndexHtmlOutput');
      return opts
    },
    beforeWebpack: (opts) => {
      opts.state.logger.log('@react-static/logging: beforeWebpack');
      return opts
    },
    afterWebpack: (opts) => {
      opts.state.logger.log('@react-static/logging: afterWebpack');
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
