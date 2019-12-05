import { tarball } from "pacote";
import path from "path";
import fse from "fs-extra";
import tar from "tar";
import { osHomeDirectory } from "./osHomeDirectory";
import { fillInTemplate } from "./fillInTemplate";
function targetPathFromName(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/ |\//g, "-")
        .replace(/[^-_a-z0-9]/g, "");
}
export async function copyFromTemplate(manifest, isLocal, localPath, name, packageManager) {
    const targetPath = path.join(process.cwd(), targetPathFromName(name));
    const actualPath = await (isLocal
        ? copyLocalTemplateAppAsync(localPath, targetPath, name)
        : extractRemoteTemplateAppAsync(`${manifest.name}@${manifest.version}`, targetPath, name));
    return fillInTemplate(actualPath, {
        name,
        isLocal,
        localPath,
        packageManager
    });
}
async function copyLocalTemplateAppAsync(sourcePath, targetPath, _name) {
    await fse.copy(sourcePath, targetPath);
    return targetPath;
}
export async function extractRemoteTemplateAppAsync(templateSpec, targetPath, _name) {
    const tarStream = tarball.stream(templateSpec, {
        cache: path.join(osHomeDirectory(), "template-cache")
    });
    await fse.mkdirs(targetPath);
    await new Promise((resolve, reject) => {
        const extractStream = tar.x({
            cwd: targetPath,
            strip: 1,
            onentry(entry) {
                if (entry.type &&
                    /^file$/i.test(entry.type) &&
                    path.basename(entry.path) === "gitignore") {
                    // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
                    // See: https://github.com/npm/npm/issues/1862
                    entry.path = entry.path.replace(/gitignore$/, ".gitignore");
                }
            }
        });
        tarStream.on("error", reject);
        extractStream.on("error", reject);
        extractStream.on("close", resolve);
        tarStream.pipe(extractStream);
    });
    return targetPath;
}
