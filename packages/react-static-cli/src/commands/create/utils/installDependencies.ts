import spawn from "cross-spawn"

export async function installDependencies(
  packageManager: "yarn" | "npm"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = packageManager === "yarn" ? "yarnpkg" : "npm"
    const handle = spawn(command, ["install"], { cwd: process.cwd() })
    // handle.on("error", reject)
    handle.on("close", code =>
      code === 0
        ? resolve()
        : reject(
          new Error(
            `Non-zero exit code: ${code} (${handle.stderr &&
                handle.stderr.read()})`
          )
        )
    )
  })
}
