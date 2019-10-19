import fse from "fs-extra"

interface TemplateValues {
  name: string
}

export async function fillInTemplate(
  actualPath: string,
  { name }: TemplateValues
): Promise<string> {
  const packageJsonPath = `${actualPath}/package.json`
  const packageJson = await fse.readJSON(packageJsonPath)

  packageJson["name"] = name

  await fse.writeJSON(packageJsonPath, packageJson)

  return actualPath
}
