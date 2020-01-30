import { isDevelopment } from '../../universal/environment'
import { ROUTES } from '../../universal/routes'
import ky, { HTTPError } from 'ky-universal'
import { FetchError } from './FetchError'
import { createRemoteResource } from '../createResource'
import { Response as CacheResponse } from 'http-cache-semantics'

const apiPromise = createRemoteResource<SiteInfo, SiteRequest, SiteResponse>({ createRequest, executeRequest, transformResponse })

type SiteInfo = {}
type SiteRequest = { url: string, method: 'GET', headers: Record<string, string> }
type SiteResponse = Omit<Response, 'headers'> & CacheResponse

function createRequest(_: string): SiteRequest {
  const fetchPath = isDevelopment()
    ? ROUTES.siteData
    : [getSiteInfoRoot(), 'site-info.json'].join('/')

  return {
    url: fetchPath,
    method: 'GET',
    headers: {
      'Accept': 'vnd.xpbytes.site-info.v1+json, application/json; q=0.8, vnd.xpbytes.errors.v1+json; q=0.1'
    }
  }
}

async function executeRequest({ url, ...options }: SiteRequest): Promise<SiteResponse> {
  try {
    const { headers: originalHeaders, ...response } = await ky(url, options)
    const headers: Record<string, string> = {}

    originalHeaders.forEach((value, key) => {
      headers[key] = value
    })

    return { ...response, headers }
  } catch (err) {
    if (err instanceof HTTPError) {
      throw new FetchError(await err.response.text(), { status: err.response.status })
    }
    throw err
  }
}

async function transformResponse(response: SiteResponse): Promise<SiteInfo> {
  return response.json()
}

function getSiteInfoRoot(): string {
  return ''
}

export async function fetchSiteInfo(): Promise<never> {
  throw (await apiPromise).read('fetchSiteInfo')
}

export async function clearSiteInfo(): Promise<void> {
  (await apiPromise).clear('fetchSiteInfo')
}
