#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prompt } from "enquirer"
import fse from "fs-extra"
import "hard-rejection/register"
import { render } from "ink"
import meow from "meow"
import os from "os"
import { Manifest, tarball } from "pacote"
import path from "path"
import React from "react"
import tar, { ReadEntry } from "tar"
import { CreateCommand as ui } from "./ui"

const cli = meow(
  `
  Usage
    $ react-static create [template] [options]

  Options
    --debug               Turn on debug messages
    --npm                 Use npm
    --yarn                Use yarn
    --name=project-name   Set the project name

  Examples
    $ react-static create blank
    Creating new project using blank template
`
)

const [inputTemplate] = cli.input

render(React.createElement(ui, { ...cli.flags, templateSpec: inputTemplate }))

async function pickProjectName(flags: {
  [name: string]: any
}): Promise<string> {
  if (flags.name && /^[-_a-z]+$/.test(flags.name)) {
    return flags.name
  }

  const { name } = await prompt<{ name: string }>({
    type: "input",
    name: "name",
    message: "Pick a name for your project",
    required: true,
    validate(val: string): boolean {
      return /^[-_a-z]+$/.test(val)
    }
  })

  return name
}

async function execute({
  templateManifest,
  packageManager,
  name
}: {
  templateManifest: Manifest & ({ __local: true; __localPath: string } | {})
  packageManager: "npm" | "yarn"
  name: string
}): Promise<string> {
  const targetPath = path.join(process.cwd(), name)

  const templateToProjectPromise = await (templateManifest.__local === true
    ? copyLocalTemplateAppAsync(
      templateManifest.__localPath as string,
      targetPath,
      name
    )
    : extractRemoteTemplateAppAsync(
      `${templateManifest.name}@${templateManifest.version}`,
      targetPath,
      name
    ))
  return templateToProjectPromise
}

async function copyLocalTemplateAppAsync(
  sourcePath: string,
  targetPath: string,
  name: string
): Promise<string> {
  await fse.copy(sourcePath, targetPath)

  return targetPath
}

export async function extractRemoteTemplateAppAsync(
  templateSpec: string,
  targetPath: string,
  name: string
): Promise<string> {
  const tarStream = tarball.stream(templateSpec, {
    cache: path.join(homeDirectory(), "template-cache")
  })

  await fse.mkdirs(targetPath)

  await new Promise((resolve, reject) => {
    const extractStream = tar.x({
      cwd: targetPath,
      strip: 1,
      onentry(entry: ReadEntry) {
        if (
          entry.type &&
          /^file$/i.test(entry.type) &&
          path.basename(entry.path) === "gitignore"
        ) {
          // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
          // See: https://github.com/npm/npm/issues/1862
          entry.path = entry.path.replace(/gitignore$/, ".gitignore")
        }
      }
    })
    tarStream.on("error", reject)
    extractStream.on("error", reject)
    extractStream.on("close", resolve)
    tarStream.pipe(extractStream)
  })

  return targetPath
}

let createdHomeDirectory = ""

function homeDirectory(): string {
  let dirPath
  if (process.env.__UNSAFE_REACT_STATIC_HOME_DIRECTORY) {
    dirPath = process.env.__UNSAFE_REACT_STATIC_HOME_DIRECTORY
  } else {
    const home = os.homedir()
    if (!home) {
      throw new Error(
        "Can't determine your home directory; make sure your $HOME environment variable is set."
      )
    }

    if (process.env.REACT_STATIC_STAGING) {
      dirPath = path.join(home, ".react-static-staging")
    } else if (process.env.REACT_STATIC_LOCAL) {
      dirPath = path.join(home, ".react-static-local")
    } else {
      dirPath = path.join(home, ".react-static")
    }
  }

  if (createdHomeDirectory !== dirPath) {
    fse.mkdirSync(dirPath)
    createdHomeDirectory = dirPath
  }

  return dirPath
}
