import React from 'react'
import { render } from '@testing-library/react'
import { default as App } from '../src/app'

describe('hello world', () => {
  it('renders', () => {
    expect(() => render(<App />)).not.toThrow()
  })
})
