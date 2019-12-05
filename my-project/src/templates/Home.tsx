import React from 'react'
import { Link } from 'react-router-dom'

export function Home(): JSX.Element {
  console.log("Rendering the home page")

  return (
    <div style={{ border: "3px double red" }}>
      <header><h2>The home page is here</h2></header>
      <ul>
        <li>
          <Link to={"/blog"}>My blog</Link>
        </li>
        <li>
          <Link to={"/blog/11"}>My blog item (n: 11)</Link>
        </li>
      </ul>
    </div>
  )
}

export default Home
