#!/usr/bin/env node
import "hard-rejection/register";
import { render } from "ink";
import meow from "meow";
import React from "react";
import chalk from "chalk";
import { CreateCommand as ui } from "./ui";
const cli = meow(`
  ${chalk.yellowBright("Usage")}
    $ react-static create [template] [options]

  ${chalk.yellowBright("Options")}
    --debug               Turn on debug messages
    --npm                 Use npm
    --yarn                Use yarn
    --name=project-name   Set the project name

  ${chalk.yellowBright("Examples")}
    $ react-static create blank
    Creating new project using blank template
`);
const [inputTemplate] = cli.input;
render(React.createElement(ui, { ...cli.flags, templateSpec: inputTemplate }));
