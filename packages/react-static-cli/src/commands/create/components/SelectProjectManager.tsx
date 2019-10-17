import React, { useEffect } from "react"

import { Box, Text, Color } from "ink"
import SelectInput, { ItemOfSelectInput } from "ink-select-input"

import { detectYarn } from "../utils/detectYarn"

interface SelectPackageManagerProps {
  packageManager: "npm" | "yarn" | undefined
  onSelect(value: "npm" | "yarn"): void
}

export function SelectPackageManager({
  packageManager,
  onSelect
}: SelectPackageManagerProps): JSX.Element {
  const promote = packageManager || detectYarn() || undefined

  useEffect(() => {
    // If pre-selected npm or if yarn can't be detected, default to npm.
    if (promote === "npm" || promote === undefined) {
      onSelect("npm")
    }
  }, [promote])

  const handleSubmit = ({ value }: ItemOfSelectInput): void =>
    onSelect(value ? "yarn" : "npm")

  return (
    <Box flexDirection="column">
      <Text>
        Found Yarn {promote}. Use <Color bold>Yarn</Color> to install
        dependencies?
      </Text>
      <Box flexDirection="row">
        <Box marginRight={1}>
          <Color cyanBright>package manager</Color>
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
