import React from "react";
import { Box, Text, Color } from "ink";
import { UncontrolledTextInput as TextInput } from "ink-text-input";
import chalk from "chalk";
export function InputProjectName({ name, onSubmit }) {
    return (<Box marginTop={1}>
      <Box marginRight={Math.max(0, "package manager".length - "name".length) + 3}>
        <Color cyan>
          <Text>name</Text>
        </Color>
      </Box>
      <TextInput placeholder={chalk.gray(name || "(my-project)")} onSubmit={onSubmit}/>
    </Box>);
}
