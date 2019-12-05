#!/usr/bin/env node
import "hard-rejection/register";
import { render } from "ink";
import meow from "meow";
import React from "react";
import { PluginCommand as ui } from "./ui";
const cli = meow(`
  Usage
    $ react-static plugin [options]

  Options
    --debug             Turn on debug messages
    --name=plugin-name  Set the project name
    --official          Use the @react-static scope

  Examples
    $ react-static plugin --name="sitemap" --official

    Creating a new plugin @react-static/plugin-sitemap
    using all the default settings, configurations and
    files. If the plugin already exists, attempts to
    upgrade the repository.
`);
render(React.createElement(ui, { ...cli.flags }));
