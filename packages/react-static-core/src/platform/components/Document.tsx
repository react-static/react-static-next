import React from 'react'

export interface DocumentProps {
  Html: React.ElementType,
  Head: React.ElementType,
  Body: React.ElementType,
  children: React.ReactNode
}

/**
 * This component is used by the platform to make sure there is a proper HTML page in place when generating the pages
 * during the build / export steps.
 */
export function Document({ Html, Head, Body, children }: DocumentProps): JSX.Element {
  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="generator" content={`React Static 8`} />
      </Head>
      <Body>{children}</Body>
    </Html>
  )
}

export const Html = ({ children, ...rest }: JSX.IntrinsicElements['html']): JSX.Element => (
  <html lang="en" {...rest}>
    {children}
  </html>
)

export const Head = ({ children, ...rest }: JSX.IntrinsicElements['head']): JSX.Element => (
  <head {...rest}>{children}</head>
)

export const Body = ({ children, ...rest }: JSX.IntrinsicElements['body']): JSX.Element => (
  <body {...rest}>{children}</body>
)
