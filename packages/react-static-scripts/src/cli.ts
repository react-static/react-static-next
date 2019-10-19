#!/usr/bin/env node

import React from 'react'
import { render } from 'ink'
import meow from 'meow'

import 'hard-rejection/register'
import fs from 'fs'
import path from 'path'

import { App as ui } from './ui'

const cli = meow(
  `
  Usage
    $ react-static-scripts [command]

  Commands
    start     Start a development server
    build     Build the project (for production)
    lint      Run eslint on the project
    test      Run project tests using jest
    bundle    Bundle the project for production
    export    Export the project to HTML

  Options
    --help    Show this help or the command's help

  Note
    These scripts are not meant to be installed globally,
    but should be a devDependency of the react-static
    project. Add "scripts" to package.json that call this
    cli:

    "scripts": {
      "start": "react-static-scripts start",
      "build": "react-static-scripts build"
      "lint": "react-static-scripts lint"
      "test": "react-static-scripts test"
      "bundle": "react-static-scripts build"
      "export": "react-static-scripts export"
    }
`,
  { autoHelp: false }
)

function isInternal(): boolean {
  return process.env.REACT_STATIC_ENV === 'internal'
}

function isCommand(command: string): boolean {
  if (!command) {
    return false
  }

  return fs.existsSync(
    path.resolve(
      __dirname,
      isInternal() ? 'internal' : 'commands',
      command.replace(':', '_').replace(/[^-_a-z]/g, ''),
      'cli.js'
    )
  )
}

function runCommand(command: string, args: string[]): void {
  import('child_process')
    .then(({ spawnSync }) =>
      spawnSync(
        'node',
        [
          path.resolve(
            __dirname,
            isInternal() ? 'internal' : 'commands',
            command.replace(':', '_').replace(/[^-_a-z]/g, ''),
            'cli.js'
          ),
          ...args,
        ],
        { stdio: 'inherit' }
      )
    )
    .then((spawn) => {
      process.exit(spawn.status || 0)
    })
}

const [command] = cli.input

if (isCommand(command)) {
  runCommand(command, process.argv.slice(3))
} else if (cli.flags.help) {
  cli.showHelp()
} else {
  render(React.createElement(ui, cli.flags))
}
