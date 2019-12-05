import React from 'react'
import { useCurrentRouteData } from '@react-static/core'

interface BlogRouteData {
  item: number
}

export function Blog(): JSX.Element {
  const { item } = useCurrentRouteData() as BlogRouteData

  return (
    <div>
      <header>This is a blog</header>
      <article>Item: {item}</article>
    </div>
  )
}

export default Blog
