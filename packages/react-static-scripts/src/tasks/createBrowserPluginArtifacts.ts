import { State } from '@react-static/types'
import path from 'path'
import fse from 'fs-extra'

import { sanitizeName } from '@react-static/core/dist/platform/utils'

export async function createBrowserPluginArtifacts(rawState: Readonly<State>): Promise<State> {
  const state = await runBeforeState(rawState)

  const template = (await fse.readFile(path.join(__dirname, '..', 'templates', 'app.plugins.js.template'))).toString()
  const plugins = state.data.plugins
    .filter((plugin) => plugin.app)
    .filter((plugin, index, self) => self.findIndex((s) => s.app === plugin.app) === index)
    .map(({ name, ...rest }, index) => ({ ...rest, name: `Plugin${sanitizeName(name)}${index}` }))

  state.logger.debug(`createBrowserPluginArtifacts: outputting ${plugins.length} browser plugins`)

  const imports = plugins.map(({ name, app: importPath }) => `import ${name} from '${(importPath as string).replace(/\\/g, '/')}'`).join('\n')
  const evaluation = plugins.map(({ name, options }) => `typeof ${name} === 'function' ? ${name}(${JSON.stringify(options)}) : ${name}`).join(',\n')

  const artifact = template.replace(/\{\{imports\}\}/, imports).replace(/\{\{evaluation\}\}/, evaluation)

  return writeOutput(await runBeforeOutput(state, artifact))
}

async function runBeforeState(state: Readonly<State>): Promise<State> {
  return (await state.plugins.beforePluginArtifacts({ state })).state
}

async function runBeforeOutput(state: Readonly<State>, artifact: Readonly<string>): Promise<OutputOptions> {
  return await state.plugins.beforePluginArtifactsOutput({ state, artifact })
}

async function writeOutput({ state, artifact }: OutputOptions): Promise<State> {
  const dest = state.config.paths.artifacts.plugins
  state.logger.debug(`createBrowserPluginArtifacts: writing ${artifact.length} chars to ${dest}`)

  await fse.outputFile(dest, artifact)
  return state
}

interface OutputOptions {
  state: State
  artifact: string
}

