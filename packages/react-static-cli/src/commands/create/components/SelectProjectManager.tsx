import React, { useEffect, useRef, useState } from "react"

import { Box, Text, Color } from "ink"
import SelectInput, { ItemOfSelectInput } from "ink-select-input"
import StyledBox from "ink-box"
import Spinner from "ink-spinner"

import { detectYarn } from "../utils/detectYarn"

interface SelectPackageManagerProps {
  packageManager: "npm" | "yarn" | undefined
  onSelect(value: "npm" | "yarn"): void
}

export function SelectPackageManager({
  packageManager,
  onSelect
}: SelectPackageManagerProps): JSX.Element {
  const [version, setVersion] = useState<{
    packageManager: "npm" | "yarn" | undefined
    version?: string
  }>({ packageManager })

  useEffect(() => {
    let active = true

    if (version.packageManager === undefined) {
      detectYarn().then(
        result => {
          if (active) {
            setVersion({
              packageManager: result.found ? "yarn" : "npm",
              version: result.version
            })
          }
        },
        () => onSelect("npm")
      )
    } else if (version.packageManager === "npm") {
      onSelect("npm")
    }

    return (): void => {
      active = false
    }
  }, [version])

  const handleSubmit = ({ value }: ItemOfSelectInput): void =>
    onSelect(value ? "yarn" : "npm")

  // Still getting version
  if (version.version === undefined) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Color green>
          <Spinner type="dots" />
        </Color>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <StyledBox style="round" padding={1}>
        <Text>
          Found Yarn {version.version}. Use <Color bold>Yarn</Color> to install
          dependencies?
        </Text>
      </StyledBox>
      <Box flexDirection="row">
        <Box marginRight={1}>
          <Color cyan>package manager</Color>
        </Box>
        <SelectInput
          items={[
            { value: true, label: "yarn" },
            { value: false, label: "npm" }
          ]}
          onSelect={handleSubmit}
        />
      </Box>
    </Box>
  )
}
