import { getPorts } from 'portfinder'

export function findAvailablePorts(
  startPort: number,
  count = 2
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    getPorts(count, { startPort }, (err, ports) => {
      if (err) {
        reject(err)
        return
      }

      resolve(ports)
    })
  })
}
