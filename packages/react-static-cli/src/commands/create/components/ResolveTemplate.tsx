import React, { useEffect, useState } from "react"

import { Box, Color, Text } from "ink"
import Spinner from "ink-spinner"
import { Manifest } from "pacote"

import {
  resolveTemplate,
  resolveTemplateFallback
} from "../utils/resolveTemplate"

interface ResolveTemplateProps {
  templateSpec: string
  onResolved(template: Manifest, isLocal: boolean, localPath?: string): void
}

export function ResolveTemplate({
  templateSpec,
  onResolved
}: ResolveTemplateProps): JSX.Element {
  const [error, setError] = useState<Error>()

  useEffect(() => {
    let active = true

    resolveTemplate(templateSpec)
      .catch(() => {
        return resolveTemplateFallback(templateSpec)
      })
      .then(
        ({ template, isLocal, localPath }) => {
          active && onResolved(template, isLocal, localPath)
        },
        err => {
          active && setError(err)
        }
      )

    return (): void => {
      active = false
    }
  }, [templateSpec, onResolved])

  if (error) {
    return (
      <Box>
        <Color red>
          <Text>{error.message}</Text>
        </Color>
      </Box>
    )
  }

  return (
    <Box>
      <Box marginRight={"package manager".length - "template".length + 1}>
        <Color yellowBright>template</Color>
      </Box>
      <Color green>
        <Spinner type="dots" />
      </Color>
      {` Retrieving ${templateSpec}`}
    </Box>
  )
}
