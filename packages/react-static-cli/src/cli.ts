#!/usr/bin/env node

import React from "react"
import { render } from "ink"
import meow from "meow"
import chalk from "chalk"

import "hard-rejection/register"
import fs from "fs"
import path from "path"

import { App as ui } from "./ui"

const cli = meow(
  `
  ${chalk.yellowBright("Usage")}
    $ react-static [command]

  ${chalk.yellowBright("Commands")}
    create    Create a new project
    plugin    Create a new plugin
    template  Create a new template

    start     Start a react-static development server
    build     Build a react-static project (for production)

  ${chalk.yellowBright("Options")}
    --name    Your name
    --help    Show this help or the command's help

  ${chalk.yellowBright("Examples")}
    $ react-static create @react-static/template-blank
    Creating new project using blank template

    $ react-static plugin --name="sitemap"
    Creating a new plugin called sitemap

    $ react-static template --name="blog"
    Creating a new template called blog
`,
  { autoHelp: false }
)

const KNOWN_SCRIPTS = Object.freeze([
  "start",
  "build",
  "bundle",
  "export",
  "test",
  "link"
])

/**
 * Transforms the given command into the path to the file that should be
 * executed when this command is executed
 * @param command
 */
function commandToPath(command: string): string {
  const normalised = command.replace(/:/g, "_").replace(/[^-_a-z]/g, "")
  return path.resolve(__dirname, "commands", normalised, "cli.js")
}

/**
 * Tests if the command given is a known @react-static/cli command
 * @param command
 */
function isCommand(command: string): boolean {
  return fs.existsSync(commandToPath(command))
}

/**
 * Tests if the given command is actually a @react-static/scripts script
 * @param command the potential script
 */
function isScript(command: string): boolean {
  if (KNOWN_SCRIPTS.indexOf(command) !== -1) {
    return true
  }

  // TODO: if in project dir, maybe go into node_modules
  // and figure out if this is a script?
  return false
}

/**
 * Searches for react-static configuration file in the current working
 * directory, on various places. If it is found we can assume that we're
 * currently in a react-static project directory
 */
function isInProjectDirectory(): boolean {
  const paths = [".", "src"]
  const files = ["static.config.js", "static.config.ts"]

  return paths.some(dir =>
    files.some(file => fs.existsSync(path.join(process.cwd(), dir, file)))
  )
}

/**
 * Runs the given command with a set of arguments as a child process
 * @param command
 * @param args
 */
function runCommand(command: string, args: string[]): Promise<void> {
  return import("child_process")
    .then(({ spawnSync }) =>
      spawnSync("node", [commandToPath(command), ...args], { stdio: "inherit" })
    )
    .then(spawn => {
      process.exit(spawn.status || 0)
    })
}

/**
 * Attempts to forward the given "command" as a script to the current project's
 * dependency @react-static/scripts.
 * @param command the script to forward
 * @param args the arguments to pass on
 */
async function runScript(command: string, args: string[]): Promise<void> {
  if (!isInProjectDirectory()) {
    return showNonProjectDirectoryMessage()
  }

  await showRedirectMessage()

  return import("child_process")
    .then(({ spawnSync }) =>
      spawnSync("react-static-scripts", [command, ...args], {
        stdio: "inherit"
      })
    )
    .then(spawn => {
      process.exit(spawn.status || 0)
    })
}

async function showNonProjectDirectoryMessage(): Promise<void> {
  const exec = (text: string): string => chalk.yellowBright(text)
  const json = (text: string): string => chalk.blue(text)
  const mute = (text: string): string => chalk.grey(text)
  const file = (text: string): string => chalk.green(text)

  const i = chalk.red("-")

  const xPackage = exec("@react-static/scripts")
  const xAlternative = exec("react-static create")
  const fExample = file("static.config.ts")
  const fPackage = file("package.json")
  const hNote = mute("Note")

  const jScripts = json("scripts")

  console.log(
    "  " +
      `
  Can't run a ${xPackage} command in a non-project directory. This cli
  was looking for a react-static configuration file, such as ${fExample},
  but didn't find one.

  ${i} If you have not created a react-static project yet, use
    ${xAlternative} first.
  ${i} Otherwise, make sure you're inside a project directory.

  ${hNote}
    Since React Static 8, it is recommended to use the ${jScripts} section of
    your project's ${fPackage} instead of the cli to start a dev server, or
    build the project for production.
`.trim()
  )
}

async function showRedirectMessage(): Promise<void> {
  const exec = (text: string): string => chalk.yellowBright(text)
  const json = (text: string): string => chalk.blue(text)
  const mute = (text: string): string => chalk.grey(text)
  const file = (text: string): string => chalk.green(text)

  const xPackage = exec("@react-static/scripts")
  const fPackage = file("package.json")
  const hNote = mute("Note")

  const jScripts = json("scripts")

  console.log(
    `
  Forwarding the command to ${xPackage}.

  ${hNote}
    Since React Static 8, it is recommended to use the ${jScripts} section of
    your project's ${fPackage} instead of the cli to start a dev server, or
    build the project for production.


    `.trim()
  )
}

async function runGlobalHelp(): Promise<void> {
  cli.showHelp(-1)
}

async function run(
  command: string | undefined,
  { flags }: typeof cli["flags"]
): Promise<void> {
  if (command && isCommand(command)) {
    // The first two args are node and the current file
    // ... then there is the command ...
    // ... so the rest are arguments we want to pass on
    return runCommand(command, process.argv.slice(3))
  }

  if (command && isScript(command)) {
    return runScript(command, process.argv.slice(3))
  }

  if (flags.help) {
    return runGlobalHelp()
  }

  return render(React.createElement(ui, flags)).waitUntilExit()
}

//
// Actually run this CLI
//

const [command] = cli.input
run(command, cli)
