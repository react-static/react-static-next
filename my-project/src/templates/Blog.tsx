import React from 'react'
import { useRouteData } from '@react-static/core'

export function Blog(): JSX.Element {
  const { item } = useRouteData()

  return (
    <div>
      <header>This is a blog</header>
      <article>Item: {item}</article>
    </div>
  )
}

export default Blog
