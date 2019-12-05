import { useContext, ContextType } from 'react'
import { StaticInfoContext } from '../contexts/StaticInfoContext'

/**
 * Retrieves the static data, which is also known as the pre-rendered
 * "hydration" data.
 *
 * In development, there is never any data present
 */
export function useStaticData(): ContextType<typeof StaticInfoContext> {
  return useContext(StaticInfoContext)
}

export function hasValidStaticData(staticData: unknown): staticData is { path: string } {
  if (typeof staticData !== 'object' || staticData === null) {
    return false
  }

  return 'path' in staticData && typeof (staticData as { path: unknown }).path === 'string'
}
