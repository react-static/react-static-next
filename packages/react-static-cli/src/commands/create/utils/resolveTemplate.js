import { manifest } from "pacote";
import path from "path";
import fse from "fs-extra";
export async function resolveTemplate(templateSpec) {
    return manifest(templateSpec).then(template => ({
        template,
        isLocal: false
    }));
}
export async function resolveTemplateFallback(templateSpec) {
    const [nonScopedPackage, packageOrVersion, _] = templateSpec.split("@");
    if (!/react-static/.test(packageOrVersion)) {
        throw new Error(`404 Not Found - ${nonScopedPackage}`);
    }
    const localPath = path.join(__dirname, "..", "..", "..", "..", "..", packageOrVersion.replace("/", "-"), "package.json");
    if (!fse.existsSync(localPath)) {
        throw new Error(`404 Not Found - @${packageOrVersion}`);
    }
    const template = await import(localPath);
    return {
        template,
        isLocal: true,
        localPath: path.dirname(localPath)
    };
}
