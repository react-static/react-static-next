import { Manifest, tarball } from "pacote"

import path from "path"
import fse from "fs-extra"
import tar, { ReadEntry } from "tar"
import { osHomeDirectory } from "./osHomeDirectory"
import { fillInTemplate } from "./fillInTemplate"

function targetPathFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ |\//g, "-")
    .replace(/[^-_a-z0-9]/g, "")
}

export async function copyFromTemplate(
  manifest: Manifest,
  isLocal: boolean,
  localPath: string | undefined,
  name: string
): Promise<string> {
  const targetPath = path.join(process.cwd(), targetPathFromName(name))

  const actualPath = await (isLocal
    ? copyLocalTemplateAppAsync(localPath as string, targetPath, name)
    : extractRemoteTemplateAppAsync(
      `${manifest.name}@${manifest.version}`,
      targetPath,
      name
    ))

  return fillInTemplate(actualPath, { name })
}

async function copyLocalTemplateAppAsync(
  sourcePath: string,
  targetPath: string,
  _name: string
): Promise<string> {
  await fse.copy(sourcePath, targetPath)

  return targetPath
}

export async function extractRemoteTemplateAppAsync(
  templateSpec: string,
  targetPath: string,
  _name: string
): Promise<string> {
  const tarStream = tarball.stream(templateSpec, {
    cache: path.join(osHomeDirectory(), "template-cache")
  })

  await fse.mkdirs(targetPath)

  await new Promise((resolve, reject) => {
    const extractStream = tar.x({
      cwd: targetPath,
      strip: 1,
      onentry(entry: ReadEntry) {
        if (
          entry.type &&
          /^file$/i.test(entry.type) &&
          path.basename(entry.path) === "gitignore"
        ) {
          // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
          // See: https://github.com/npm/npm/issues/1862
          entry.path = entry.path.replace(/gitignore$/, ".gitignore")
        }
      }
    })
    tarStream.on("error", reject)
    extractStream.on("error", reject)
    extractStream.on("close", resolve)
    tarStream.pipe(extractStream)
  })

  return targetPath
}
