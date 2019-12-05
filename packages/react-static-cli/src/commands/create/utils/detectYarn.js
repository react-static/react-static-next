import { valid } from "semver";
import spawn from "cross-spawn";
export async function detectYarn() {
    return new Promise(resolve => {
        const process = spawn.sync("yarnpkg", ["--version"], {});
        if (process.status !== 0) {
            return resolve({ found: false });
        }
        const version = process.stdout.toString().trim();
        if (!valid(version)) {
            return resolve({ found: false });
        }
        return resolve({ found: true, version });
    });
}
