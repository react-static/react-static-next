import { valid } from "semver"
import spawn from "cross-spawn"

export function detectYarn(): string | false {
  try {
    const version = spawn
      .sync("yarnpkg", ["--version"], { stdio: "pipe" })
      .stdout.toString()
      .trim()

    if (!valid(version)) {
      return false
    }

    return version
  } catch (e) {
    return false
  }
}
