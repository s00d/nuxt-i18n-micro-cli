import { ensureDirectoryExists } from '../utils/dir'
import { writeFileBuffer } from '../utils/file'
import { convertToPO } from '../utils/po'
import {
  buildGlobalPoFilePath,
  buildPagePoDirectoryPath,
  buildPagePoFilePath,
} from '../utils/translation-paths'
import type { I18nProject } from '../Project'

export async function exportProjectToPo(project: I18nProject, potsDir: string): Promise<void> {
  ensureDirectoryExists(potsDir)

  for (const localeCode of project.getLocaleCodes()) {
    const localeSet = project.getLocale(localeCode)

    const globalPoPath = buildGlobalPoFilePath(potsDir, localeCode)
    writeFileBuffer(globalPoPath, convertToPO(localeSet.global))

    for (const pageScope of localeSet.getPageScopes()) {
      ensureDirectoryExists(buildPagePoDirectoryPath(potsDir, pageScope))
      const pagePoPath = buildPagePoFilePath(potsDir, pageScope, localeCode)
      writeFileBuffer(pagePoPath, convertToPO(localeSet.pages[pageScope] ?? {}))
    }
  }
}
