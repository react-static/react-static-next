import { spawnSync } from 'child_process'
import path from 'path'
import fse from 'fs-extra'
import chalk from 'chalk'

const json = fse.readJSONSync(path.join(process.cwd(), 'package.json'))

console.log(
  `Running internal build with watch of ${chalk.yellowBright(
    `${json['name']}@${json['version']}`
  )} via ${chalk.blue('@react-static/scripts')}`
)

const spawn = spawnSync(
  'yarn',
  [
    'cross-env',
    'BABEL_ENV=build',
    'yarn',
    'babel',
    'src',
    '--out-dir dist',
    '--source-maps',
    '--extensions .ts,.tsx',
    '--root-mode upward',
    '--no-comments',
    '--watch',
  ],
  { stdio: 'inherit', cwd: process.cwd() }
)

process.exit(spawn.status || 0)
