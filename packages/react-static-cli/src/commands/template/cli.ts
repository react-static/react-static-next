#!/usr/bin/env node

import "hard-rejection/register"
import { render } from "ink"
import meow from "meow"
import React from "react"
import { PluginCommand as ui } from "./ui"

const cli = meow(
  `
  Usage
    $ react-static template [options]

  Options
    --debug             Turn on debug messages
    --name=plugin-name  Set the project name
    --official          Use the @react-static scope

  Examples
    $ react-static template --name="blog" --official

    Creating a new template @react-static/template-blog
    using all the default settings, configurations and
    files. If the template already exists, attempts to
    upgrade the repository.
`
)

render(React.createElement(ui, { ...cli.flags }))
