import spawn from "cross-spawn"
import chalk from "chalk"

interface InstallDependenciesResult
  extends Readonly<InstallDependenciesResult> {
  messages: readonly ReportableMessage[]
}

/**
 * This installs all the dependencies in the current working directory.
 *
 * @param packageManager
 */
export async function installDependencies(
  packageManager: "yarn" | "npm"
): Promise<InstallDependenciesResult> {
  return new Promise((resolve, reject) => {
    const command = packageManager === "yarn" ? "yarnpkg" : "npm"
    const handle = spawn(command, ["install"], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: process.env
    })

    handle.addListener("message", message => reject(new Error(message)))

    const messages: ReportableMessage[] = []

    if (handle.stderr) {
      handle.stderr.on("data", message => {
        messages.push({ type: "error", data: message.toString() })
      })
    }

    if (handle.stdout) {
      handle.stdout.on("data", message => {
        messages.push({ type: "message", data: message })
      })
    }

    handle.on("close", status => {
      if (status === 0) {
        return resolve({ messages })
      }

      // If the status is non-successfull, show all the messages. It will
      // highlight the error messages, and have the rest be dimmed. This
      // ensures the error surfaces.
      reject(
        new Error(
          `${chalk.red(
            `Non-zero exit code: ${status}`
          )}\n${messages
            .map(obj =>
              chalk[
                obj.type === "error"
                  ? obj.data.startsWith("warning")
                    ? "yellowBright"
                    : "red"
                  : "gray"
              ](obj.data)
            )
            .join("")}`
        )
      )
    })
  })
}
