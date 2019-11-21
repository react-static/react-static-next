import React, { useMemo } from "react"
import SelectInput from "ink-select-input"

import FEATURED_TEMPLATES from "../data/FEATURED"
import padEnd from "lodash.padend"
import trimStart from "lodash.trimstart"
import wordwrap from "wordwrap"
import { Box, Text, Color } from "ink"

interface SelectTemplateProps {
  onSelect(value: string): void
}

export function SelectTemplate({ onSelect }: SelectTemplateProps): JSX.Element {
  const handleSelect = ({ value }: { value: string }): void => {
    onSelect(value)
  }

  // Get description column size
  const descriptionColumn = useMemo(
    () =>
      Math.max(
        ...FEATURED_TEMPLATES.map(t =>
          typeof t === "object" ? t.shortName.length : 0
        )
      ) + 2,
    []
  )

  const columns = (process.stdout.columns || 80) - "package manager".length - 2

  // Wrap text
  const wrap = useMemo(() => wordwrap(descriptionColumn + 2, columns), [
    descriptionColumn
  ])

  const items = useMemo(
    () =>
      FEATURED_TEMPLATES.map(template => {
        const label =
          padEnd(template.shortName, descriptionColumn) +
          (columns > 60 ? trimStart(wrap(template.description)) : "")

        return {
          label,
          value: template.name
        }
      }),
    [wrap, descriptionColumn]
  )

  return (
    <Box flexDirection="row" marginTop={1}>
      <Box marginRight={"package manager".length - "template".length + 1}>
        <Color cyan>
          <Text>template</Text>
        </Color>
      </Box>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  )
}
