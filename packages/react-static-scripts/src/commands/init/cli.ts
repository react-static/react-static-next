import fse from 'fs-extra'
import path from 'path'
import chalk from 'chalk'

console.log('TODO: create init command to generate static config')

const projectRootPath = process.cwd()
const projectPackagePath = path.join(projectRootPath, 'package.json')

// Ensure project is set-up
if (!fse.existsSync(projectPackagePath)) {
  process.stderr.write(
    chalk`
No {yellowBright package.json} found.

Create a {yellowBright package.json} first, and add {greenBright @react-static/scripts} as {yellowBright devDependency}
    `.trim() + '\n'
  )
  process.exit(-1)
}

const useTypeScript =
  fse.existsSync(path.join(projectRootPath, 'tsconfig.json')) ||
  fse.readJSONSync(projectPackagePath)['devDependencies']['typescript']

const outputPath = useTypeScript ? 'static.config.ts' : 'static.config.js'

fse.outputFileSync(
  outputPath,
  `
${
  useTypeScript
    ? 'import { AppConfig } from "@react-static/scripts"'
    : `
/**
 * @type {import('@react-static/scripts').ReactStatic.PlatformConfig}
 */
`.trim()
}
const config${useTypeScript ? ': AppConfig' : ''} = {
  getRoutes: async ()${
  useTypeScript ? ": ReturnType<AppConfig['getRoutes']>" : ''
} => {
    const items = [
      { data: 'example', id: 1 },
      { data: 'other', id: 2 }
    ]

    // Creates the /items route, and exposes ALL item data
    // Creates the /items/1 and /items/2 routes, and exposes a single item
    return [
      {
        path: '/items',
        getData: ()${useTypeScript ? ': unknown' : ''} => ({ items }),
        children: items.map((item) => ({
          path: \`/\${item.id}\`,
          template: 'src/containers/Item',
          getData: ()${useTypeScript ? ': unknown' : ''} => ({
            item,
          }),
        })),
      },
    ]
  },
  plugins: [
    [
      '@react-static/plugin-source-filesystem',
      {
        location: './src/pages',
      },
    ],
    '@react-static/plugin-reach-router',
    '@react-static/plugin-sitemap',
  ],
}

export default config
  `.trim() + '\n'
)
