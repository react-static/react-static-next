import React from 'react';
import { Text, Color, Box } from 'ink';
export function App({ name }) {
    return (<Box flexDirection="column">
      <Text>
        Hello, <Color green>{name}</Color>.
      </Text>
      <Text>
        <Color red>-</Color> Use{' '}
        <Color yellowBright>react-static-scripts --help</Color> to see all the
        available commands.
      </Text>
      <Text>
        <Color red>-</Color> Use{' '}
        <Color yellowBright>react-static-scripts --name=</Color>
        <Color red>&quot;name&quot;</Color> if you don&apos;t want to be a
        stranger...
      </Text>
    </Box>);
}
App.defaultProps = {
    name: 'Stranger',
};
