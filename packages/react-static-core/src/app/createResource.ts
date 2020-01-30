import Cache from 'lru-cache'
import CachePolicy from 'http-cache-semantics'

type NoCachePolicy = false | null | undefined

type CachedItem<T> = { policy: CachePolicy, item: T }

export interface RemoteResource {
  clear(key?: string): void
  preload(key: string): Promise<void>
  read(key: string): never
}

export interface RemoteResourceOptions<
  T = unknown,
  Request extends CachePolicy.Request = CachePolicy.Request,
  Response extends CachePolicy.Response = CachePolicy.Response
> {
  createCache?(): Promise<Cache.Options<string, CachedItem<T>>> | Cache.Options<string, CachedItem<T>>
  createCachePolicy?(key: string): Promise<CachePolicy.Options | NoCachePolicy> |  CachePolicy.Options | NoCachePolicy
  createRequest(key: string): Promise<Request> | Request
  executeRequest(request: Request): Promise<Response>
  transformResponse(response: Response): Promise<T> | T
}

const DEFAULT_CACHE_OPTIONS: Cache.Options<string, CachedItem<unknown>> = Object.freeze({
  max: 512,
  maxAge: 1000 * 60 * 60
})

const DEFAULT_CACHE_POLICY_OPTIONS: CachePolicy.Options = Object.freeze({
  shared: false,
})

export async function createRemoteResource<
  T = unknown,
  Request extends CachePolicy.Request = CachePolicy.Request,
  Response extends CachePolicy.Response = CachePolicy.Response
>(options: RemoteResourceOptions<T, Request, Response>): Promise<RemoteResource> {
  const { createCache, createCachePolicy, createRequest, executeRequest, transformResponse } = options

  const errors: Record<string, Error> = {}
  const inflight: Record<string, Promise<T>> = {}
  const cache = await createCacheUsing(createCache)

  async function load(key: string): Promise<T> {
    if (inflight[key]) {
      return inflight[key]
    }

    const request = await createRequest(key)
    const cachedItem = cache.get(key)

    // Retrieve from cache
    if (cachedItem && cachedItem.policy.satisfiesWithoutRevalidation(request)) {
      return cachedItem.item
    }

    const options = await createCachePolicyOptionsUsing(key, createCachePolicy)

    try {
      const response = await executeRequest(request)
      const item = await transformResponse(response)
      const policy = new CachePolicy(request, response, options)

      if (policy.storable()) {

        if (cachedItem) {
          const revalidatedPolicy = cachedItem.policy.revalidatedPolicy(request, response)
          if (revalidatedPolicy.modified === false) {
            // update in cache
            cache.set(key, { policy: revalidatedPolicy.policy, item })

            return item
          }
        }

        // new in cache
        cache.set(key, { policy, item })
      }

      return item
    } catch (err) {
      errors[key] = err
      throw err
    }
  }

  function read(key: string): never {
    if (errors[key]) {
      throw errors[key]
    }

    if (inflight[key]) {
      throw inflight[key]
    }

    throw (inflight[key] = load(key)
      .then((val) => {
        delete inflight[key]
        return val
      }, (err) => {
        delete inflight[key]
        throw err
      })
    )
  }

  async function preload(key: string): Promise<void> {
    try {
      read(key)
    } catch (err) {
      if ('then' in err) {
        await err
      }
    }
  }

  function clear(key?: string): void {
    if (key) {
      delete errors[key]
      cache.del(key)

      return
    }

    Object.keys(errors).forEach((key) => {
      delete errors[key]
    })

    cache.reset()
  }

  return {
    clear,
    read,
    preload
  }
}

async function createCacheUsing<T>(createCache: RemoteResourceOptions<T>['createCache']): Promise<Cache<string, CachedItem<T>>> {
  if (createCache !== undefined) {
    return new Cache(await createCache())
  }

  return new Cache(DEFAULT_CACHE_OPTIONS as Cache.Options<string, CachedItem<T>>)
}

async function createCachePolicyOptionsUsing<T>(key: string, createCachePolicy: RemoteResourceOptions<T>['createCachePolicy']): Promise<CachePolicy.Options> {
  if (createCachePolicy !== undefined) {
    const options = await createCachePolicy(key)

    if (options) {
      return options
    }
  }
  return DEFAULT_CACHE_POLICY_OPTIONS
}
