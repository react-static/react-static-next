#!/usr/bin/env node

import 'hard-rejection/register'
import fse from 'fs-extra'
import path from 'path'
import os from 'os'

import { PluginConfigList } from '@react-static/types'
import { createLogger } from '../../tasks/createLogger'
import { createIndexHtmlFile } from '../../tasks/createIndexHtmlFile'
import { fetchSiteData } from '../../tasks/fetchSiteData'
import { fetchRoutes } from '../../tasks/fetchRoutes'
import { runDevServer } from '../../tasks/runDevServer'
import { PlatformConfig, RouteConfig, State } from '../../../../react-static-types/index'
import { fetchPlugins } from '../../tasks/fetchPlugins'
import { createBrowserPluginArtifacts } from '../../tasks/createBrowserPluginArtifacts'
import { createBrowserTemplatesArtifacts } from '../../tasks/createBrowserTemplatesArtifacts'

const expectedRootPackagePath = path.join(process.cwd(), 'package.json')
const expectedRootPath = path.dirname(expectedRootPackagePath)
// const expectedConfigPath = path.join(expectedRootPath, 'static.config.js')

if (!fse.existsSync(expectedRootPackagePath)) {
  throw new Error(`Expected ${expectedRootPackagePath} to exist`)
}

const processTempPath = fse.mkdtempSync(path.join(os.tmpdir(), 'react-static-'))

const FAKE_CONFIG: PlatformConfig = {
  html: {},
  paths: {
    root: expectedRootPath,
    src: path.join(expectedRootPath, 'src'),
    dist: {
      root: path.join(expectedRootPath, 'dist'),
      assets: path.join(expectedRootPath, 'dist', 'assets'),
      html: path.join(expectedRootPath, 'dist', 'index.html'),
    },
    temp: processTempPath,
    artifacts: {
      root: path.join(expectedRootPath, 'artifacts'),
      plugins: path.join(expectedRootPath, 'artifacts', 'app.plugins.js'),
      templates: path.join(expectedRootPath, 'artifacts', 'templates.js')
    },
    public: path.join(expectedRootPath, 'public'),
    plugins: path.join(expectedRootPath, 'plugins'),
    nodeModules: path.join(expectedRootPath, 'node_modules'),
  },
  data: async () => {
    return { 'fake-site-data': 'from-fake-config', a: [1, 2, 3] }
  },
  plugins: async () => {
    const plugins: PluginConfigList = []
    plugins.push('@react-static/plugin-logging')
    plugins.push(['@react-static/plugin-source-filesystem', { debug: true }])
    plugins.push(['@react-static/plugin-sitemap', { split: true, debug: true }])
    plugins.push('@react-static/plugin-react-router')
    return plugins
  },
  routes: async () => {
    return [
      {
        path: '/',
        template: 'src/templates/Home',
        data: Promise.resolve({ home: 'my-data' }),
        children: [
          {
            path: 'blog',
            data: (): Promise<unknown> =>
              Promise.resolve({ items: [2, 3, 5, 7, 9, 11] }),
            template: 'src/templates/BlogIndex',
            children: (): RouteConfig[] => {
              return [2, 3, 5, 7, 9, 11].map((item) => {
                return {
                  path: `${item}`,
                  data: async (): Promise<unknown> => ({ item }),
                  template: 'src/templates/Blog',
                }
              })
            },
          },
        ],
      },
      {
        path: '/404'
      }
    ]
  },
  siteRoot: undefined,
  silent: false,
  verbose: true
}

const InputEnvironment = [
  process.env.REACT_STATIC_ENV,
  process.env.REACT_ENV,
  process.env.NODE_ENV,
].filter(Boolean)[0]

// Promise is handled by hard-rejection/register
; (async (): Promise<void> => {
  process.env.REACT_STATIC_ENV = process.env.REACT_ENV = process.env.NODE_ENV =
            InputEnvironment || 'development'

  const initialState: Readonly<State> = {
    stage: 'dev',
    config: FAKE_CONFIG,
    data: {
      site: undefined,
      routes: [],
      plugins: []
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: undefined as unknown as any,
    logger: console
  }

  const devState = await Promise.resolve(initialState)
    .then((nextState: Readonly<State>) => createLogger(nextState))
    .then((nextState: Readonly<State>) => fetchPlugins(nextState))
    .then((nextState: Readonly<State>) => createDirectories(nextState))
    .then((nextState: Readonly<State>) => createIndexHtmlFile(nextState))
    .then((nextState: Readonly<State>) => fetchSiteData(nextState))
    .then((nextState: Readonly<State>) => fetchRoutes(nextState))
    .then((nextState: Readonly<State>) => createBrowserPluginArtifacts(nextState))
    .then((nextState: Readonly<State>) => createBrowserTemplatesArtifacts(nextState))

  const stateWithActions = await runDevServer(devState, { config: {} })

  await new Promise((): void => {
    // wait until user exists
    stateWithActions.logger.warn(`Press 'R' to force a reload`)

    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    process.stdin.on('data', function(text) {
      const char = text.toString().trim().toUpperCase()[0]

      switch (char) {
        case 'R': {
          stateWithActions.logger.log('Triggering a reload!')
          stateWithActions.reload()
          break
        }
        case 'X': {
          stateWithActions.logger.log('Triggering a restart!')
          stateWithActions.restart()
          break
        }
      }
    })
  })
})()

async function createDirectories(rawState: Readonly<State>): Promise<State> {
  const { state } = await rawState.plugins.beforeDirectories({ state: rawState })

  // Create all directories (TODO: incremental)
  await fse.mkdirp(state.config.paths.dist.root)
  await fse.emptyDir(state.config.paths.dist.root)
  await fse.mkdirp(state.config.paths.artifacts.root)
  await fse.emptyDir(state.config.paths.artifacts.root)

  const { state: nextState } = await state.plugins.afterDirectories({ state })

  return nextState
}
