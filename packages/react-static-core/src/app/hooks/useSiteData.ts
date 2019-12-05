import { delay } from '../delay'
import { fetchSiteInfo } from '../fetch/fetchSiteInfo'
import { useReloadOnChange } from './useReloadOnChange'

const LOADED_SITE_DATA: { current: object | undefined } = { current: undefined }
const LOADING_SITE_DATA: { current: Promise<unknown> | undefined } = {
  current: undefined,
}

function isLoaded(siteData: object | undefined): siteData is object {
  return typeof siteData !== 'undefined'
}

function clearStorage(): void {
  LOADED_SITE_DATA.current = undefined
  LOADING_SITE_DATA.current = undefined
}

function getSiteData(): object {
  const { current: data } = LOADED_SITE_DATA

  if (data instanceof Error) {
    throw data
  }

  if (typeof data !== 'object' || !data) {
    throw LOADING_SITE_DATA.current
  }

  return data
}

async function loadAndStore(): Promise<object> {
  LOADING_SITE_DATA.current = LOADING_SITE_DATA.current || fetchSiteInfo()

  const data = await LOADING_SITE_DATA.current
  if (typeof data === 'object' && data) {
    LOADED_SITE_DATA.current = data
    return data
  }

  return Promise.reject(
    new Error(`Expected site data to be an object (got: ${typeof data})`)
  )
}

/**
 * Fetches the global site data
 *
 * In production, this file lives near the site root or public assets path
 * In development, this file is "generated" on the fly
 *
 * @returns {object}
 */
export function useSiteData(): object {
  useReloadOnChange(clearStorage)

  if (isLoaded(LOADED_SITE_DATA.current)) {
    return getSiteData()
  }

  // prefetch
  throw Promise.all([delay(500), loadAndStore()]).catch(
    (err) => {
      LOADED_SITE_DATA.current = err
    }
  )
}
