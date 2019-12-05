# @react-static/plugin-react-router

Adds [React Router][web-react-router] to your React Static project.

## Installation

Add the plugin to your project, as well as all the `peerDependencies`:

```bash
yarn add @react-static/plugin-react-router react-router-dom
```

> The peerDependencies allow you to change the version of react-router-dom used
> without much friction. This installation guide is assuming you already depend
> on @react-static/core (via @react-static/scripts) and react itself.

And to your `static.config.ext`:

```json5
{
  /* ...configuration */
  "plugins": [
    /* plugins before this one */
    "@react-static/plugin-react-router"
    /* plugins after this one */
  ]
}
```

## Usage

The following illustrates how this package can be used in conjunction with the
standard eco-system. This also means that the [standard usage][react-static-core-docs]
apply (e.g. using the `render` prop on `StaticRoutes` to change how rendering
works, for example if you want to add animations).

```tsx
// This code should live in your project
import { StaticRoot, StaticRoutes } from '@react-static/core'

export function App(): JSX.Element {
  return (
    <StaticRoot>
      {/*
        * At least one child; re-renders each location change, is in the
        * router context.
        */
       }

       <StaticRoutes />
    </StaticRoot>
  )
}
```

## Configuration

At this moment there are no options passable to the `Plugin` configuration,
except for `props` to be added to the underlying router:

```ts
{
  "plugins": [
    [
      '@react-static/plugin-react-router',
      {
        BrowserRouterProps: {
          basename: '/app'
        },
        StaticRouterProps: {
          /* ... */
        }
      }
    ]
  ]
}
```

The props that can be passed are of `Partial<BrowserRouterProps>` for the key
`BrowserRouterProps`, and `Partial<StaticRouterProps>` for the key
`StaticRouterProps`. See the technical details below for more information.

## Technical details

This plugin inserts a React Router in the tree at the location of `StaticRoot`,
which means that:

- anything inside the subtree of `StaticRoot` is in the router's context
- the immediate subtree is re-rendered when the location changes.

For development and exported browser builds, a `BrowserRouter` is used. During
pre-rendering, a `StaticRouter` is used (which can take a "static" path).

The react-router `location` is then parsed and its `pathname` is passed to the
`RouteContext`, before rendering the children. This also means that anywhere
in the subtree of `StaticRoot`, you may use core tools that rely on this
context, such as `useCurrentRouteData()`.

## Common configurations

### My app does not live at the root

The [documentation][web-react-router-basename] for react-router talks about the
`basename` configuration option:

> The base URL for all locations. If your app is served from a sub-directory
> on your server, you’ll want to set this to the sub-directory. A properly
> formatted basename should have a leading slash, but no trailing slash.

It can be set by changing your `static.config.ext`, assigning `basename` to the
`BrowserRouterProps`, as illustrated above.

### Routes not in `static.confix.ext`

Because anything under `StaticRoot` is in a router context, you can use the
tools provided by `react-router`, including [`Switch`][web-react-router-switch]
as well as other options.

```tsx
// This code should live in your project
import { StaticRoot, StaticRoutes } from '@react-static/core'
import { Route, Switch } from 'react-router-dom'

export function App(): JSX.Element {
  return (
    <StaticRoot>
      <Switch>
        <Route path="/not-in-config">
          <NotInConfigComponent />
        </Route>

        <Route>
          <StaticRoutes />
        </Route>
      </Switch>
    </StaticRoot>
  )
}
```

> ⚠ **NOTE**: because of how path matching works in react-router, you need
> to be vigilant of paths and subpaths, when working with and without the
> `exact` parameter.
>
> However, it is perfectly fine to have multiple `StaticRoutes` in your tree,
> so you can use that to overcome issues regarding "partial" matches.

[web-react-router]: https://reacttraining.com/react-router/web/
[web-react-router-basename]: https://reacttraining.com/react-router/web/api/BrowserRouter/basename-string
[web-react-router-switch]: https://reacttraining.com/react-router/web/api/Switch
[react-static-core-docs]: https://github.com/react-static/react-static
