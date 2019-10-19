import React from "react"
import { Text, Color, Box } from "ink"

interface AppProps {
  name?: string
}

export function App({ name }: AppProps): JSX.Element {
  return (
    <Box flexDirection="column">
      <Text>
        Hello, <Color greenBright>{name}</Color>.
      </Text>
      <Text>
        <Color redBright>-</Color> Use{" "}
        <Color yellowBright>react-static --help</Color> to see all the available
        commands.
      </Text>
      <Text>
        <Color redBright>-</Color> Use{" "}
        <Color yellowBright>react-static --name=</Color>
        <Color red>&quot;name&quot;</Color> if you don&apos;t want to be a
        stranger...
      </Text>
    </Box>
  )
}

App.defaultProps = {
  name: "Stranger"
}
