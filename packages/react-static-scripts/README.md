# @react-static/scripts

The base of any [react-static][git-react-static] project.

## Installation

This package should have been added to your project using the
[`@react-static/cli`][git-react-static-cli], and not be manually added. The
official templates all come bundled with `@react-static/scripts`. If you need
to add this manually, run:

```shell
yarn add @react-static/scripts -D
```

...and add the appropiate scripts to `package.json`:

```json5
{
  // ...
  "scripts": {
    "start": "react-static-scripts start",
    "build": "react-static-scripts build",
    "export": "react-static-scripts export",
    "bundle": "react-static-scripts bundle",
    "lint": "react-static-scripts lint",
    "test": "react-static-scripts test"
  }
}
```

## Usage

### Running a development server

```shell
# Using yarn
yarn start

# Using npm
npm run start

# Using a globally installed react-static-scripts (discouraged)
react-static-scripts start
```

Starts a react-static development server, using the current directory as
project root. This means that the current directory should have a react static
configuration file `static.config.ext` (where `ext` can be `.js` or `.ts`).

This CLI automatically opens the default browser on the correct web address,
and exposes where the "react-static" development routes live. For example, the
project might be running on `http://localhost:8000/`, and the path exposed
during startup might be `__react-static-server__/0.1.0`. Browse to that path to
get more information.

### Creating a static copy (pre-render routes with hydration data bundled)

```shell
# Using yarn
yarn build

# Using npm
npm run build

# Using a globally installed react-static-scripts (discouraged)
react-static-scripts build
```

### Ready for deployment (export)

```shell
# Using yarn
yarn export

# Using npm
npm run export

# Using a globally installed react-static-scripts (discouraged)
react-static-scripts export
```

[git-react-static]: https://github.com/react-static/react-static
[git-react-static-cli]: https://github.com/react-static/react-static/tree/master/packages/react-static-cli
