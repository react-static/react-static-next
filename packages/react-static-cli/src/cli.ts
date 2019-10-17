#!/usr/bin/env node

import React from "react"
import { render } from "ink"
import meow from "meow"

import "hard-rejection/register"
import fs from "fs"
import path from "path"

import { App as ui } from "./ui"

const cli = meow(
  `
  Usage
    $ react-static [command]

  Options
    --name  Your name

  Examples
    $ react-static --name=Jane
    Hello, Jane

    $ react-static create blank
    Creating new project using blank template
`,
  { autoHelp: false }
)

function isCommand(command: string): boolean {
  if (!command) {
    return false
  }

  return fs.existsSync(
    path.resolve(
      __dirname,
      "commands",
      command.replace(/[^-_a-z]/g, ""),
      "cli.js"
    )
  )
}

function runCommand(command: string, args: string[]): void {
  import("child_process")
    .then(({ spawnSync }) =>
      spawnSync(
        "node",
        [
          path.resolve(
            __dirname,
            "commands",
            command.replace(/[^-_a-z]/g, ""),
            "cli.js"
          ),
          ...args
        ],
        { stdio: "inherit" }
      )
    )
    .then(spawn => {
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
