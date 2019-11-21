// This order is significant. react-hot-loader MUST be imported before react and
// react-dom in order to work correctly.

import 'react-hot-loader'
import { createElement } from 'react'
import { render } from 'react-dom'

// Your top level component
import { App, HotApp } from './App'

// If in the browser
if (typeof document !== 'undefined') {
  const target = document.getElementById('root')

  if (!target) {
    throw new Error('Expected an element with id="root"')
  }

  render(createElement(HotApp), target)
}

// Export your top level component as JSX (for static rendering)
export { App }
