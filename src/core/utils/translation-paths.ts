import path from 'node:path'

export function buildRemoteConfigPath(cwd: string): string {
  return path.join(cwd, '.i18n-remote.json')
}

export function buildLocaleFilePath(translationDir: string, localeCode: string): string {
  return path.join(translationDir, `${localeCode}.json`)
}

export function buildPagesDirectoryPath(translationDir: string): string {
  return path.join(translationDir, 'pages')
}

export function getLocaleCodeFromLocaleFilePath(filePath: string): string {
  return path.basename(filePath, '.json')
}

export function buildSplitLocaleDirectoryPath(outputDir: string, localeCode: string): string {
  return path.join(outputDir, localeCode)
}

export function buildSplitPartFilePath(outputDir: string, localeCode: string, partName: string): string {
  return path.join(outputDir, localeCode, `${partName}.json`)
}

export function buildGlobalPoFilePath(potsDir: string, localeCode: string): string {
  return path.join(potsDir, `${localeCode}.po`)
}

export function buildPagePoDirectoryPath(potsDir: string, pageScope: string): string {
  return path.join(potsDir, 'pages', pageScope)
}

export function buildPagePoFilePath(potsDir: string, pageScope: string, localeCode: string): string {
  return path.join(buildPagePoDirectoryPath(potsDir, pageScope), `${localeCode}.po`)
}
