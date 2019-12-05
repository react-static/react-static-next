import React from 'react'
import { useCurrentRouteData } from '@react-static/core'
import { Link } from 'react-router-dom'

interface BlogIndexRouteData {
  items: number[]
}

export function BlogIndex(): JSX.Element {
  const { items } = useCurrentRouteData() as BlogIndexRouteData

  return (
    <div>
      <header>This is a blog index</header>
      <ul>
        <li><Link to="/">Home</Link></li>
        {items.map((item) => <li key={item}><Link to={`/blog/${item}`} >See blog item {item}</Link></li>)}
        <li><Link to="/missing">Doesn&apos;t exit</Link></li>
      </ul>
    </div>
  )
}

export default BlogIndex
