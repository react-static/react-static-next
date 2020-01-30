import { fetchSiteInfo, clearSiteInfo } from '../fetch/fetchSiteInfo'
import { useReloadOnChange } from './useReloadOnChange'

/**
 * Fetches the global site data
 *
 * In production, this file lives near the site root or public assets path
 * In development, this file is "generated" on the fly
 *
 * @returns {object}
 */
export function useSiteData(): object {
  useReloadOnChange(clearSiteInfo)

  throw fetchSiteInfo()
}
