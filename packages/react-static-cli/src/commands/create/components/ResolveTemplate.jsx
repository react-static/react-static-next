import React, { useEffect, useState } from "react";
import { Box, Color, Text } from "ink";
import Spinner from "ink-spinner";
import { resolveTemplate, resolveTemplateFallback } from "../utils/resolveTemplate";
export function ResolveTemplate({ templateSpec, onResolved }) {
    const [error, setError] = useState();
    useEffect(() => {
        let active = true;
        resolveTemplate(templateSpec)
            .catch(() => {
            return resolveTemplateFallback(templateSpec);
        })
            .then(({ template, isLocal, localPath }) => {
            active && onResolved(template, isLocal, localPath);
        }, err => {
            active && setError(err);
        });
        return () => {
            active = false;
        };
    }, [templateSpec, onResolved]);
    if (error) {
        return (<Box>
        <Color red>
          <Text>{error.message}</Text>
        </Color>
      </Box>);
    }
    return (<Box>
      <Box marginRight={"package manager".length - "template".length + 1}>
        <Color yellowBright>template</Color>
      </Box>
      <Color green>
        <Spinner type="dots"/>
      </Color>
      {` Retrieving ${templateSpec}`}
    </Box>);
}
