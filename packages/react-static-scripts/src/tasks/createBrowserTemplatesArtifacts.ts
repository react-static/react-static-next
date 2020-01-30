import { State } from '@react-static/types'
import path from 'path'
import fse from 'fs-extra'

import { sanitizeName } from '@react-static/core/dist/platform/utils'

/**
 * Creates the artifact file that is responsible for serving react-static
 * templates in the browser. It creates, by default, a file called templates.js
 * which in turn loads each of the project's templates.
 *
 * Since version 8.0.0, it does NOT alter the state itself, but hooks
 * running before, during and after this task are able to.
 *
 */
export async function createBrowserTemplatesArtifacts(rawState: Readonly<State>): Promise<State> {
  const state = await runBeforeState(rawState)
  const template = await readTemplate()
  const { routes, templates } = collectArtifacts(state)

  state.logger.debug(`createBrowserTemplatesArtifacts: outputting ${templates.length} templates for ${routes.length} unique routes`)

  const imports = templates.map(({ name, template: importPath }) => `import ${name} from '${resolveArtifact(state, importPath!)}'`).join('\n')
  const evaluation = templates.map(({ name, template }) => `registerTemplate('${template}', ${name})`).join('\n') + '\n' +
    routes.map(({ path: routePath, template }) => `// assignTemplate('${routePath}', '${template}')`).join('\n')

  const artifact = template.replace(/\{\{imports\}\}/, imports).replace(/\{\{evaluation\}\}/, evaluation)

  return writeOutput(await runBeforeOutput(state, artifact))
}

async function runBeforeState(state: Readonly<State>): Promise<State> {
  return (await state.plugins.beforePluginArtifacts({ state })).state
}

async function readTemplate(): Promise<string> {
  const inFile = path.join(__dirname, '..', 'templates', 'app.templates.js.template')
  return (await fse.readFile(inFile)).toString()
}

async function runBeforeOutput(state: Readonly<State>, artifact: Readonly<string>): Promise<OutputOptions> {
  return await state.plugins.beforePluginArtifactsOutput({ state, artifact })
}

async function writeOutput({ state, artifact }: OutputOptions): Promise<State> {
  const dest = state.config.paths.artifacts.templates
  state.logger.debug(`createBrowserTemplatesArtifacts: writing ${artifact.length} chars to ${dest}`)

  await fse.outputFile(dest, artifact)
  return state
}

class IndexRouteNotDefined extends Error {
  constructor() {
    super(`
Define a route with the path "/".

There is no route with a path of / which means that there is no index route.
At this moment, React Static requires there to be an index route, even if its
just a redirect to the "actual home".
`.trim())
  }
}

function collectArtifacts(state: Readonly<State>): { routes: RouteArtifact[], templates: TemplateArtifact[] } {

  const routes = state.data.routes
    .filter((route) => route.path)
    .filter((route, index, self) => self.findIndex((s) => s.path === route.path) === index)

  const templates = routes
    .filter((route) => route.template)
    .filter((route, index, self) => self.findIndex((s) => s.template === route.template) === index)
    .map(({ template, ...rest }, index) => ({ ...rest, template, name: `Template_${sanitizeName(path.basename(template!))}${index}` }))

  const indexRoute = routes.find((route) => route.path === '/')
  const missingRoute = routes.find((route) => route.path === '/404')

  // If no index has been defined
  if (!indexRoute) {
    throw new IndexRouteNotDefined()
  }

  // If no custom 404 has been defined
  if (!missingRoute || !missingRoute.template) {

    const template404 = resolveDefaultArtifact(state, '@react-static/core/dist/app/components/Default404.js')

    const defaultMissingRoute = missingRoute || {
      path: '/404',
      data: {},
      template: undefined
    }

    defaultMissingRoute.template = template404

    // Ensure it exists in the templates list
    templates.push({
      ...defaultMissingRoute,
      name: `Template__Default__404`,
      template: template404
    })

    // Add it to the routes if necessary
    if (!missingRoute) {
      routes.push(defaultMissingRoute)
      state.logger.debug(`
createBrowserTemplatesArtifacts: There is no /404 path declared, so using the
default one. Add a route with path /404 to use your own.
      `.trim())
    } else {
      state.logger.log(`
createBrowserTemplatesArtifacts: The /404 path declared has no "template", so
using the default one. Add a "template" to the route with path /404 to use your
own.
      `.trim())
    }
  }

  return { routes, templates }
}

function resolveArtifact(state: Readonly<State>, artifactPath: string): string {
  const absolutely = path.resolve(state.config.paths.root, artifactPath)
  const relatively = path.relative(path.dirname(state.config.paths.artifacts.templates), absolutely)

  // import paths are always posix-style
  return relatively.replace(/\\/g, '/')
}

function resolveDefaultArtifact(state: Readonly<State>, artifactNodeModulePath: string): string {
  const absolutely = path.resolve(state.config.paths.nodeModules, path.normalize(artifactNodeModulePath))
  return resolveArtifact(state, absolutely)
}

interface OutputOptions {
  state: State
  artifact: string
}

type RouteArtifact = State['data']['routes'][number]
type TemplateArtifact = RouteArtifact & { name: string }

