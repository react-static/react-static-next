import { Configuration, EnvironmentPlugin } from 'webpack'
import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import { State } from '@react-static/types'
import { isDevelopment } from '@react-static/core'

/**
 * Creates the webpack configuration
 *
 * @param rawConfig the current webpack configuration
 * @param rawState the current state
 * @returns the modified webpack configuration
 */
export async function createWebpackConfig(
  rawConfig: Readonly<Configuration>,
  rawState: Readonly<State>
): Promise<Configuration> {
  const isNotDevelopment = !isDevelopment()
  const { state, config } = await runBeforeState(rawState, rawConfig)

  const {
    dist: projectDistPath,
    src: projectSrcPath,
    nodeModules: projectNodeModulesPath,
    plugins: projectPluginsPath
  } = state.config.paths

  const builtConfig: Configuration = {
    output: {
      path: projectDistPath.root,
      filename: '[name].js',
    },
    devtool: isNotDevelopment ? undefined : 'cheap-module-eval-source-map' as const,
    // Items above are overridden
    ...config,
    // Items below are augmented
    /*entry: [

    ],*/
    resolve: {
      // Search in these places, that is:
      // - project /src
      // - project /plugins
      // - project /node_modules
      // - node_modules of wherever @react-static/scripts lives
      modules: [
        projectSrcPath,
        projectPluginsPath,
        projectNodeModulesPath,
        'node_modules'
      ],
      extensions: [
        '.wasm',
        '.mjs',
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        ...((config.resolve && config.resolve.extensions) || []),
      ],
      alias: {
        // Ensure we only ever load a single react package!
        react: path.resolve(projectNodeModulesPath, 'react'),
        // This allows a consumer to have a _different_ version of react-dom vs
        // @hot-loader/react-dom depending on the environment.
        //
        // TODO: once webpack supports it, move to fast-refresh instead of
        //       hot-loader, if possible
        'react-dom': path.resolve(
          projectNodeModulesPath,
          isNotDevelopment ? 'react-dom' : '@hot-loader/react-dom'
        ),
        //
        ...((config.resolve && config.resolve.alias) || {}),
      },
    },
    module: {
      strictExportPresence: true,
      ...config.module,
      rules: [
        {
          test: /\.(m|j|t)sx?$/,
          // Compile those typescript and javascript files in the /src and
          // /plugins directories of the react-static project
          include: [
            projectSrcPath,
            projectPluginsPath
          ],
          use: {
            loader: 'babel-loader',
            options: {
              highlightCode: true,
              cacheDirectory: true,
              babelrc: false,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: [
                        '>0.25%',
                        'not dead',
                        'not op_mini all'
                      ]
                    },
                    useBuiltIns: 'usage',
                    corejs: { version: 3.4 },
                  },
                ],
                '@babel/preset-typescript',
                [
                  '@babel/preset-react',
                  {
                    development: isDevelopment()
                  }
                ]
              ],
              plugins: [
                'react-hot-loader/babel',
              ],
            },
          },
        },
        ...((config.module && config.module.rules) || []),
      ]
    },
    mode: webpackMode(),
    plugins: [
      ...(config.plugins || []),
      new EnvironmentPlugin({
        NODE_ENV: process.env.NODE_ENV || null,
        REACT_STATIC_ENV: process.env.REACT_STATIC_ENV || 'development',
        REACT_STATIC_PLUGINS_ARTIFACT: state.config.paths.artifacts.plugins,
        REACT_STATIC_TEMPLATES_ARTIFACT: state.config.paths.artifacts.templates
      }),
      new HtmlWebpackPlugin({
        template: `!!raw-loader!${projectDistPath.html}`,
        hash: true,
        inject: true,
      }),
    ],
  }

  return runBeforeUse(state, builtConfig)
}

async function runBeforeState(state: Readonly<State>, config: Readonly<Configuration>): Promise<{ state: State, config: Configuration }> {
  return await state.plugins.beforeWebpack({ state, config })
}

async function runBeforeUse(state: Readonly<State>, config: Readonly<Configuration>): Promise<Configuration> {
  return (await state.plugins.afterWebpack({ state, config })).config
}

const VALID_WEBPACK_MODES_FROM_ENV = ['development', 'production'] as const

function webpackMode(): 'development' | 'production' | 'none' {
  if (process.env.REACT_STATIC_ENV) {
    const foundEnv = VALID_WEBPACK_MODES_FROM_ENV.find(
      (value) => value === process.env.NODE_ENV
    )
    if (foundEnv) {
      return foundEnv
    }
  }

  if (process.env.NODE_ENV) {
    const foundEnv = VALID_WEBPACK_MODES_FROM_ENV.find(
      (value) => value === process.env.NODE_ENV
    )
    if (foundEnv) {
      return foundEnv
    }
  }

  return 'development'
}
