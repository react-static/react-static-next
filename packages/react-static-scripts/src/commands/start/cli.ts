#!/usr/bin/env node

import 'hard-rejection/register'
import fse from 'fs-extra'
import path from 'path'
import os from 'os'

import { createIndexHtmlFile } from '../../tasks/createIndexHtmlFile'
import { fetchSiteData } from '../../tasks/fetchSiteData'
import { fetchRoutes } from '../../tasks/fetchRoutes'
import { runDevServer } from '../../tasks/runDevServer'
import { PlatformConfig, RouteConfig, State } from '../../../index'

const expectedRootPackagePath = path.join(process.cwd(), 'package.json')
const expectedRootPath = path.dirname(expectedRootPackagePath)
const expectedConfigPath = path.join(expectedRootPath, 'static.config.js')

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
    artifacts: path.join(expectedRootPath, 'artifacts'),
    public: path.join(expectedRootPath, 'public'),
    plugins: path.join(expectedRootPath, 'plugins'),
    nodeModules: path.join(expectedRootPath, 'node_modules'),
  },
  data: async () => {
    return { 'fake': 'config', a: [1, 2, 3] }
  },
  plugins: async () => {
    return []
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

  let state: State = { stage: 'dev', config: FAKE_CONFIG, data: { site: undefined, routes: [] } }

  await fse.mkdirp(state.config.paths.dist.root)
  await fse.emptyDir(state.config.paths.dist.root)
  await fse.mkdirp(state.config.paths.artifacts)

  state = await createIndexHtmlFile(state)

  // Try not the build twice
  await new Promise((resolve) => setTimeout(resolve, 100))

  state = await fetchSiteData(state)
  state = await fetchRoutes(state)

  const stateWithActions = await runDevServer({ config: {}, state })

  await new Promise((): void => {
    // wait until user exists
    console.log(`Press 'R' to force a reload`)

    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    process.stdin.on('data', function(text) {
      const char = text.toString().trim()
      switch (char) {
        case 'R': {
          console.log('Triggering a reload!')
          stateWithActions.reload()
        }
      }
    })
  })
})()
