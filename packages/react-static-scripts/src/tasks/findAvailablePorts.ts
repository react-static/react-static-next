import { getPorts } from 'portfinder'

/**
 * Finds an available port to run the react static dev server on.
 *
 * @param startPort start at this port
 * @param count return this many ports
 * @returns An array of exactly @see {count} size, containing available ports
 */
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
