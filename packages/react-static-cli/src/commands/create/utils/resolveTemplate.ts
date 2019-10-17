import { Manifest, manifest } from "pacote"
import path from "path"
import fse from "fs-extra"

type ResolvedTemplate = { template: Manifest } & (
  | { isLocal: true; localPath: string }
  | { isLocal: false; localPath?: undefined })

export async function resolveTemplate(
  templateSpec: string
): Promise<ResolvedTemplate> {
  return manifest(templateSpec).then(template => ({
    template,
    isLocal: false as false
  }))
}

export async function resolveTemplateFallback(
  templateSpec: string
): Promise<ResolvedTemplate> {
  const [nonScopedPackage, packageOrVersion, _] = templateSpec.split("@")
  if (!/react-static/.test(packageOrVersion)) {
    throw new Error(`404 Not Found - ${nonScopedPackage}`)
  }

  const localPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    packageOrVersion.replace("/", "-"),
    "package.json"
  )

  if (!fse.existsSync(localPath)) {
    throw new Error(`404 Not Found - @${packageOrVersion}`)
  }

  const template: Manifest = await import(localPath)

  return {
    template,
    isLocal: true as true,
    localPath: path.dirname(localPath)
  }
}
