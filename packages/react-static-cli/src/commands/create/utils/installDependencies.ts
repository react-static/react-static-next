import spawn from "cross-spawn"
import chalk from "chalk"

interface Message {
  type: "message" | "error"
  data: string
}

export async function installDependencies(
  packageManager: "yarn" | "npm"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = packageManager === "yarn" ? "yarnpkg" : "npm"
    const handle = spawn(command, ["install"], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: process.env
    })

    handle.addListener("message", message => reject(new Error(message)))

    const messages: Message[] = []

    if (handle.stderr) {
      handle.stderr.on("data", message => {
        messages.push({ type: "error", data: message })
      })
    }

    if (handle.stdout) {
      handle.stdout.on("data", message => {
        messages.push({ type: "message", data: message })
      })
    }

    handle.on("close", status => {
      if (status === 0) {
        return resolve()
      }

      reject(
        new Error(
          `${chalk.redBright(`Non-zero exit code: ${status}`)}\n${messages
            .map(obj =>
              chalk[obj.type === "error" ? "redBright" : "gray"](obj.data)
            )
            .join("")}`
        )
      )
    })
  })
}
