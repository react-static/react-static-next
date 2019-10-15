#!/usr/bin/env node

import React from "react"
import { render } from "ink"
import meow from "meow"

import { App as ui } from "./ui"

const cli = meow(`
  Usage
    $ react-static

  Options
    --name  Your name

  Examples
    $ react-static --name=Jane
    Hello, Jane
`)

render(React.createElement(ui, cli.flags))
