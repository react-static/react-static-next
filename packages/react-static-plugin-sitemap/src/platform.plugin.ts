import { PlatformPlugin, State } from '@react-static/types'

import fs from 'fs'
import path from 'path'
import builder from 'xmlbuilder'

interface PluginOptions {
  siteRoot?: string
  excludePatterns?: Array<string | RegExp>
  split?: boolean | { n: number }
  filename?: string
  indexFileName?: string
  pretty?: false
}

const DEFAULT_SPLIT = { n: 5000 } as const
const GOOGLE_HELP_URL = 'https://support.google.com/webmasters/answer/183668?hl=en&ref_topic=4581190#sitemapformat'

export default ({ siteRoot, excludePatterns, split, filename, indexFileName, pretty }: PluginOptions = {}): PlatformPlugin => {

  const excludePredicates = (excludePatterns || []).map(
    (pattern) => typeof pattern === 'string'
      ? (input: string): boolean => input === pattern
      : (input: string): boolean => pattern.test(input)
  )

  let splitOption: false | { n: number }
  let generateFilename: (n: number) => string

  if (split) {
    splitOption = split === true ? DEFAULT_SPLIT : split

    if (filename) {
      generateFilename = makeGenerateSplitFilename(filename, indexFileName)
    } else {
      generateFilename = makeDefaultGenerateSplitFilename(indexFileName)
    }
  } else {
    splitOption = false
    generateFilename = makeGenerateSingleFilename(filename)
  }

  return {
    hooks: {
      // TODO: after export, not after routes
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      afterRoutes: async ({ state, routes, ...rest }) => {

        const sortedRoutes = routes.sort((a, b) => a.path.localeCompare(b.path))
          .filter((route) => excludePredicates.every((exclude) => !exclude(route.path)))

        let batchCount: number
        if (splitOption === false) {
          if (sortedRoutes.length > DEFAULT_SPLIT.n) {
            console.warn(`
You have at least ${sortedRoutes.length} routes in your sitemap. Google, among
others has a limit on the amount of URLS that may be present in a sitemap. You
can tell @react-static/plugin-sitemap to split up your sitemap automatically:

{
  "plugins": [
    ["@react-static/plugin-sitemap", { split: true }]
  ]
}

If your sitemap has become too big, you can make it smaller by passing in the
maxmimum number of routes per sitemap:

{
  "plugins": [
    ["@react-static/plugin-sitemap", { split: { n: MAXIMUM_NUMBER } }]
  ]
}

Learn more at:
${GOOGLE_HELP_URL}
            `.trim())
          }

          batchCount = sortedRoutes.length
        } else {
          batchCount = splitOption.n
        }

        const anySiteRoot = siteRoot || state.config.siteRoot
        const resolvedSiteRoot = await ((typeof anySiteRoot === 'function' ? anySiteRoot(state) : anySiteRoot) || findHomePage(state))

        const sitemapPaths: string[] = []
        const promises: Promise<void>[] = []

        for(let i = 0; i * batchCount < sortedRoutes.length; i += 1) {
          const writableRoutes = sortedRoutes.splice(0, batchCount)
          const filename = generateFilename(i + 1)

          // Where the sitemap will be stored (file url)
          const dest = path.resolve(path.join(state.config.paths.dist.root, filename))

          // Where the sitemap will live (public url)
          sitemapPaths.push([resolvedSiteRoot, filename].join('/'))

          // Build the sitemap
          const sitemapXml = builder.create('urlset')
          sitemapXml.attribute('xmlns', "http://www.sitemaps.org/schemas/sitemap/0.9")

          writableRoutes.forEach((route) => {
            const url = sitemapXml.ele('url')
            url.ele('loc', resolvedSiteRoot + route.path)
            url.ele('lastmod', new Date().toDateString())
          })

          const sitemapData = sitemapXml.end({ pretty: pretty === false || true })

          promises.push(new Promise((resolve, reject) => {
            fs.writeFile(dest, sitemapData, (err) => {
              if (err) {
                reject(err)
                return
              }

              resolve()
            })
          }))
        }

        if (splitOption !== false) {
          const filename = generateFilename(0)
          const dest = path.resolve(path.join(state.config.paths.dist.root, filename))

          const indexXml = builder.create('sitemapindex')
          indexXml.attribute('xmlns', "http://www.sitemaps.org/schemas/sitemap/0.9")

          sitemapPaths.forEach((sitemapPath) => {
            indexXml.ele('sitemap')
              .ele('loc', sitemapPath)
          })

          const sitemapIndexData = indexXml.end({ pretty: pretty === false || true })
          promises.push(new Promise((resolve, reject) => {
            fs.writeFile(dest, sitemapIndexData, (err) => {
              if (err) {
                reject(err)
                return
              }

              resolve()
            })
          }))
        }

        await Promise.all(promises)
        return { state, routes, ...rest }
      }
    }
  }
}

function makeGenerateSplitFilename(filename: string, indexFileNameOption?: string): ((n: number) => string) {
  const indexFileName = indexFileNameOption || 'sitemap.xml'
  return (n: number): string => n === 0 ? indexFileName : filename.replace('{n}', `${n}`)
}

function makeDefaultGenerateSplitFilename(indexFileNameOption?: string): ((n: number) => string) {
  const indexFileName = indexFileNameOption || 'sitemap.xml'
  return (n: number): string => n === 0 ? indexFileName : `sitemap${n}.xml`
}

function makeGenerateSingleFilename(filenameOption?: string): ((n: number) => string) {
  const filename = filenameOption || 'sitemap.xml'
  return (_: number): string => filename
}

async function findHomePage(state: Readonly<State>): Promise<string> {
  const projectPackageJsonPath = path.join(state.config.paths.root, 'package.json')
  return new Promise((resolve) => {
    fs.readFile(projectPackageJsonPath, (err, data) => {
      if (!err) {
        const parsed = JSON.parse(data.toString())
        if (parsed["homepage"]) {
          return resolve(parsed["homepage"])
        }
      }

      console.warn(`
In order to generate a sitemap, the site's root url must be known, as sitemaps
must contain fully-qualified URLs. By default @react-static/plugin-sitemap will
use the "siteRoot" option for the plugin, the "siteRoot" configuration value or
the "homepage" field from package.json, in that order.

You need to supply a least one of these. If you want a different siteroot based
on some build value, or environment variable, the configuration option also
allows you to pass-in an (aysnc or sync) function, resolved at build time.

We'll now continue using "//" as site root, so you may inspect the output.
      `.trim())

      return "//"


    })
  })
}
