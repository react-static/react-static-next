# @react-static/cli

CLI to bootstrap [React Static][git-react-static] projects, templates and
plugins.

> 🚧 This is _not_ the CLI used by React Static Projects to run a development
> server or export a site to static files. Instead, you're looking for
> [`@react-static/scripts`][git-react-static-scripts].

## Install

```shell
# Using yarn
yarn global add @react-static/cli

# Using npm
npm install --global @react-static/cli
```

## CLI

```
$ react-static --help

  A progressive static site generator for React. CLI tools to bootstrap projects, plugins or templates.

  Usage
    $ react-static [command]

  Commands
    create    Create a new project
    plugin    Create a new plugin
    template  Create a new template

    start     Start a react-static development server
    build     Build a react-static project (for production)

  Options
    --name    Your name
    --help    Show this help or the command's help

  Examples
    $ react-static create @react-static/template-blank
    Creating new project using blank template

    $ react-static plugin --name="sitemap"
    Creating a new plugin called sitemap

    $ react-static template --name="blog"
    Creating a new template called blog
```

[git-react-static]: https://github.com/react-static/react-static
[git-react-static-scripts]: https://github.com/react-static/react-static/tree/master/packages/react-static-scripts
