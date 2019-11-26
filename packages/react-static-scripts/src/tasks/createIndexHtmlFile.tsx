import React from 'react'
import { renderToString } from 'react-dom/server'
import fse from 'fs-extra'

import { PlatformConfig, State } from '@react-static/types'

/**
 * Creates the index.html file in the "dist" location, which will later be
 * consumed by the webpack HtmlPlugin
 *
 * You can override the components that are being used to generate the initial
 * HTML by settings the "html": { "Document", "Html", "Head", "Body" } options
 * in the static.config.ext or by adding a plugin which sets these.
 *
 * @param rawState the intial state
 * @returns the modified state
 */
export async function createIndexHtmlFile(rawState: Readonly<State>): Promise<State> {
  const state = await runBeforeState(rawState)

  // Read out options from the configuration
  const {
    config: {
      html: { Document, Html, Head, Body },
    },
  } = state

  // Render the base document component to string with siteprops
  const Component = Document || DefaultDocument
  const DocumentHtml = renderToString(
    <Component
      Html={Html || DefaultHtml}
      Head={Head || DefaultHead}
      Body={Body || DefaultBody}
      state={state}
    >
      <div id="root" />
    </Component>
  )
  const rawHtml = `<!DOCTYPE html>${DocumentHtml}`

  // Write the Document to dist/index.html
  const outputOptions = await runBeforeOutput(state, rawHtml)
  return writeOutput(outputOptions)
}

async function runBeforeState(state: Readonly<State>): Promise<State> {
  return (await state.plugins.beforeIndexHtml({ state })).state
}

async function runBeforeOutput(state: Readonly<State>, html: Readonly<string>): Promise<OutputOptions> {
  return await state.plugins.beforeIndexHtmlOutput({ state, html })
}

async function writeOutput({ state, html }: OutputOptions): Promise<State> {
  await fse.outputFile(state.config.paths.dist.html, html)
  return state
}

type OutputOptions = { state: State, html: string}
type HtmlComponentConfig = Required<PlatformConfig['html']>

type DocumentType = HtmlComponentConfig['Document']
type HtmlType = HtmlComponentConfig['Html']
type HeadType = HtmlComponentConfig['Head']
type BodyType = HtmlComponentConfig['Body']

type DocumentProps = React.ComponentProps<DocumentType>
type HtmlProps = React.ComponentProps<HtmlType>
type HeadProps = React.ComponentProps<HeadType>
type BodyProps = React.ComponentProps<BodyType>

function DefaultDocument({
  Html,
  Head,
  Body,
  children,
}: DocumentProps): JSX.Element {
  // shrink-to-fit: can be removed once iOS 9 is no longer a thing
  // disabled-adaptations: https://responsivedesign.is/articles/getting-your-website-ready-for-apple-watch-os5/

  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="disabled-adaptations" content="watch" />
      </Head>
      <Body>{children}</Body>
    </Html>
  )
}

export function DefaultHtml({ children, ...rest }: HtmlProps): JSX.Element {
  // lang="en" vs "en-US": https://www.w3.org/International/articles/language-tags/
  return (
    <html lang="en" {...rest}>
      {children}
    </html>
  )
}

export function DefaultHead({ children, ...rest }: HeadProps): JSX.Element {
  return <head {...rest}>{children}</head>
}

export function DefaultBody({ children, ...rest }: BodyProps): JSX.Element {
  return <body {...rest}>{children}</body>
}
