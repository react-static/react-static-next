import { isDevelopment } from '../../isDevelopment'
import { ROUTES } from '@react-static/scripts/src/routes'
import ky from 'ky-universal'

function getSiteInfoRoot(): string {
  return ''
}

export async function fetchSiteInfo(): Promise<unknown> {
  // TODO if cache

  // TODO if known error

  const fetchPath = isDevelopment()
    ? ROUTES.siteData
    : [getSiteInfoRoot(), 'site-info.json'].join('/')

  return ky.get(fetchPath).json()

  // TODO catch and store as error
}
