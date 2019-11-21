import { Configuration, EnvironmentPlugin } from 'webpack'
import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import { State } from '../..'

export function createWebpackConfig(
  config: Configuration,
  state: State
): Configuration {
  const templatePath = state.config.paths.dist.html
  const isNotDevelopment = process.env.REACT_STATIC_ENV !== 'development'

  return {
    output: {
      path: path.join(process.cwd(), 'dist'),
      filename: 'static.bundle.js',
    },
    devtool: isNotDevelopment ? undefined : 'cheap-module-eval-source-map',
    ...config,
    resolve: {
      extensions: [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        ...((config.resolve && config.resolve.extensions) || []),
      ],
      alias: {
        // Ensure we only ever load a single react package!
        react: path.resolve(process.cwd(), 'node_modules', 'react'),
        // This allows a consumer to have a _different_ version of react-dom vs
        // @hot-loader/react-dom depending on the environment.
        //
        // TODO: once webpack supports it, move to fast-refresh instead of
        //       hot-loader, if possible
        'react-dom': path.resolve(
          process.cwd(),
          'node_modules',
          isNotDevelopment ? 'react-dom' : '@hot-loader/react-dom'
        ),
        ...((config.resolve && config.resolve.alias) || {}),
      },
    },
    module: {
      rules: [
        {
          test: /\.(j|t)sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              babelrc: false,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: { browsers: 'last 2 versions' },
                    useBuiltIns: 'usage',
                    corejs: { version: 3.4 },
                  },
                ],
                '@babel/preset-typescript',
                '@babel/preset-react',
              ],
              plugins: [
                // ['@babel/plugin-proposal-class-properties', { loose: true }],
                'react-hot-loader/babel',
              ],
            },
          },
        },
        ...((config.module && config.module.rules) || []),
      ],
      ...config.module,
    },
    mode: webpackMode(),
    plugins: [
      ...(config.plugins || []),
      new EnvironmentPlugin({
        NODE_ENV: process.env.NODE_ENV || null,
        REACT_STATIC_ENV: process.env.REACT_STATIC_ENV || 'development',
      }),
      new HtmlWebpackPlugin({
        template: `!!raw-loader!${templatePath}`,
        hash: true,
        inject: true,
      }),
    ],
  }
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
