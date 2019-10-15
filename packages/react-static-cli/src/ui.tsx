import React from "react"
import PropTypes from "prop-types"
import { Text, Color } from "ink"

interface AppProps {
  name?: string
}

export function App({ name }: AppProps): JSX.Element {
  return (
    <Text>
      Hello, <Color green>{name}</Color>
    </Text>
  )
}

App.propTypes = {
  name: PropTypes.string
}

App.defaultProps = {
  name: "Stranger"
}
