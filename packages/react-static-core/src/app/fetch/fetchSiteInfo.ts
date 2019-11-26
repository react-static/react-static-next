import { isDevelopment } from '../../universal/environment'
import { ROUTES } from '../../universal/routes'
import ky, { HTTPError } from 'ky-universal'
import { FetchError } from './FetchError'

function getSiteInfoRoot(): string {
  return ''
}

export async function fetchSiteInfo(): Promise<unknown> {
  // TODO if cache

  // TODO if known error

  const fetchPath = isDevelopment()
    ? ROUTES.siteData
    : [getSiteInfoRoot(), 'site-info.json'].join('/')

  return ky.get(fetchPath).json().catch(async (err) => {
    if (err instanceof HTTPError) {
      throw new FetchError(await err.response.text(), { status: err.response.status })
    }
    throw err
  })

  // TODO catch and store as error
}
