import React from "react"
import { Box, Color, Text } from "ink"
import Spinner from "ink-spinner"

interface PluginCommandProps {
  name?: string
}

export function PluginCommand(opts: PluginCommandProps): JSX.Element {
  return (
    <Box flexDirection="column">
      <Box>
        <Color grey>
          <Text>Creating a new react-static plugin</Text>
        </Color>
      </Box>
      <Color green>
        <Spinner type="dots" />
      </Color>
      {" Generating"}
    </Box>
  )
}
