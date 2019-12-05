import fse from "fs-extra";
import path from "path";
import semver from "semver";
import spawn from "cross-spawn";
function guardIsLocal(values) {
    return values.isLocal;
}
function testPackageVersion(packageName, version, localFolder) {
    const localFolderPackage = path.join(localFolder, "package.json");
    // For whatever reason, the package does not have a package.json
    if (!fse.existsSync(localFolderPackage)) {
        return false;
    }
    const localVersion = fse.readJSONSync(localFolderPackage)["version"];
    return semver.satisfies(localVersion, version);
}
export async function fillInTemplate(actualPath, values) {
    const packageJsonPath = `${actualPath}/package.json`;
    const packageJson = await fse.readJSON(packageJsonPath);
    const messages = [];
    const { name, packageManager } = values;
    // Replace the package name with the given project name
    packageJson["name"] = name;
    // If the template is locally available, look for the react-static packages
    // locally as well. If they're not found, they're kept "online".
    if (guardIsLocal(values)) {
        ;
        ["dependencies", "devDependencies"].forEach(group => {
            if (!packageJson[group]) {
                // Skip if not present
                return;
            }
            // If using npm, the "resolutions" field will not be used as it is with
            // Yarn (as of 2019-11-12). This means that dependencies of dependencies
            // will most likely fail.
            const resolutions = (packageJson["resolutions"] =
                packageJson["resolutions"] || {});
            messages.push(...linkLocalDependencies(packageJson[group], resolutions, {
                projectPath: actualPath,
                templatePath: values.localPath,
                packageManager
            }));
        });
    }
    await fse.writeJSON(packageJsonPath, packageJson, {
        replacer: undefined,
        spaces: 2
    });
    return { path: actualPath, messages };
}
function linkLocalDependencies(dependencies, resolutions, { projectPath, templatePath, packageManager }) {
    const linkPrefix = packageManager === "yarn" ? "link" : "file";
    Object.keys(dependencies).forEach(key => {
        const value = dependencies[key];
        // This can be the case if we're currently pulling this template from
        // the monorepo instead of the interwebs, or from a --local --offline
        // installation using yarn or npm (in the later case, everything
        // should work automatically, but we don't care about that, because
        // this should work as well, and this way we don't need an
        // environment variable).
        if (key.startsWith("@react-static/") && !/^(file|link):/.test(value)) {
            const directory = key.slice(1).replace("/", "-");
            const absolute = path.resolve(path.join(templatePath, "..", directory));
            // If package is available locally, link it, but only if the version
            // is satisfied. Use the package manager that's also being used for
            // the template.
            if (fse.existsSync(absolute) &&
                testPackageVersion(key, value, absolute)) {
                const linkPath = `${path.posix.normalize(path.relative(projectPath, absolute))}`;
                const linkValue = `${linkPrefix}:${linkPath}`;
                dependencies[key] = linkValue;
                resolutions[key] = linkValue;
                linkDependency(key, absolute, { cwd: projectPath, packageManager });
                const dependencyPackagePath = path.join(absolute, "package.json");
                if (fse.existsSync(dependencyPackagePath)) {
                    const dependencyPackageJson = fse.readJSONSync(dependencyPackagePath);
                    linkLocalDependencies(dependencyPackageJson["dependencies"] || {}, resolutions, {
                        projectPath,
                        templatePath,
                        packageManager
                    });
                }
                // For typescript, we now MUST add the correct path resolutions
                /*
                const tsConfigPath = path.join(projectPath, "tsconfig.json")
                if (fse.existsSync(tsConfigPath)) {
                  const tsConfigJson = fse.readJSONSync(tsConfigPath)
                  const compilerOptions = (tsConfigJson["compilerOptions"] =
                    tsConfigJson["compilerOptions"] || {})
                  const paths = (compilerOptions["paths"] =
                    compilerOptions["paths"] || {})
        
                  paths[key] = linkPath
        
                  fse.writeJSONSync(tsConfigJson, tsConfigJson, {
                    replacer: undefined,
                    spaces: 2
                  })
                }*/
            }
        }
    });
    return [];
}
function linkDependency(packageName, packagePath, { cwd, packageManager }) {
    const executable = packageManager === "yarn" ? "yarnpkg" : "npm";
    spawn.sync(executable, ["link"], { cwd: packagePath });
    spawn.sync(executable, ["link", packageName], { cwd });
}
