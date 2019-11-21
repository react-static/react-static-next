import { useContext } from 'react'
import { RouteContext } from '../contexts/RouteContext'

export function useCurrentRoutePath(): unknown {
  return useContext(RouteContext)
}
