import { State } from '@react-static/types'
import path from 'path'
import fse from 'fs-extra'

import { sanitizeName } from '@react-static/core/dist/platform/utils'

/**
 * Creates the artifact file that is responsible for serving react-static
 * plugins in the browser. It creates, by default, a file called api.plugins.js
 * which in turn loads each of the browser plugins.
 *
 * Since version 8.0.0, it does NOT alter the state itself, but hooks
 * running before, during and after this task are able to.
 */
export async function createBrowserPluginArtifacts(rawState: Readonly<State>): Promise<State> {
  const state = await runBeforeState(rawState)

  const template = await readTemplate()
  const { plugins } = collectArtifacts(state)

  state.logger.debug(`createBrowserPluginArtifacts: outputting ${plugins.length} browser plugins`)

  const imports = plugins.map(({ name, app: importPath }) => `import ${name} from '${resolveArtifact(state, importPath!)}'`).join('\n')
  const evaluation = plugins.map(({ name, options }) => `typeof ${name} === 'function' ? ${name}(${JSON.stringify(options)}) : ${name}`).join(',\n')

  const artifact = template.replace(/\{\{imports\}\}/, imports).replace(/\{\{evaluation\}\}/, evaluation)

  return writeOutput(await runBeforeOutput(state, artifact))
}

async function runBeforeState(state: Readonly<State>): Promise<State> {
  return (await state.plugins.beforePluginArtifacts({ state })).state
}

async function readTemplate(): Promise<string> {
  const inFile = path.join(__dirname, '..', 'templates', 'app.plugins.js.template')
  return (await fse.readFile(inFile)).toString()
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

function collectArtifacts(state: Readonly<State>): { plugins: PluginArtifact[] } {
  return {
    plugins: state.data.plugins
      .filter((plugin) => typeof plugin.app === 'string')
      .filter((plugin, index, self) => self.findIndex((s) => s.app === plugin.app) === index)
      .map(({ name, app, ...rest }, index) => ({
        ...rest,
        name: `Plugin_${sanitizeName(name)}${index}`,
        app: app as string
      }))
  }
}

function resolveArtifact(state: Readonly<State>, artifactPath: string): string {
  const absolutely = path.resolve(state.config.paths.root, artifactPath)
  const relatively = path.relative(path.dirname(state.config.paths.artifacts.plugins), absolutely)

  // import paths are always posix-style
  return relatively.replace(/\\/g, '/')
}

type PluginArtifact = State['data']['plugins'][number] & { app: string }
