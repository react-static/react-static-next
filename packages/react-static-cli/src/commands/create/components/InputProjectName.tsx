import React from "react"
import { Box, Text, Color } from "ink"
import { UncontrolledTextInput as TextInput } from "ink-text-input"
import chalk from "chalk"

interface InputProjectNameProps {
  name?: string
  onSubmit(name: string): void
}

export function InputProjectName({
  name,
  onSubmit
}: InputProjectNameProps): JSX.Element {
  return (
    <Box>
      <Box
        marginRight={Math.max(0, "package manager".length - "name".length) + 3}
      >
        <Color cyanBright>
          <Text>name</Text>
        </Color>
      </Box>
      <TextInput
        placeholder={chalk.gray(name || "(my-project)")}
        onSubmit={onSubmit}
      />
    </Box>
  )
}
