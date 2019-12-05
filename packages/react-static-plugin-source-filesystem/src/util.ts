import { resolve } from 'path'
import { promises } from 'fs'

const { readdir } = promises

/**
 * Gets all files in a directory, and its entire tree of sub-directories
 *
 * @param {string} directory root directory
 * @returns {Promise<string[]>} list of files
 */
export async function getFiles(directory: string): Promise<string[]> {
  const dirents = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(dirents.map(async (dirent) => {
    const res = resolve(directory, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : Promise.resolve([res]);
  }))

  return Array.prototype.concat(...files);
}
