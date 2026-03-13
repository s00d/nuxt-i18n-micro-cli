import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'
import { join } from 'pathe'
import type { I18nProject } from '../Project'
import { ensureDirectoryExists, pathExists } from '../utils/dir'
import { readTextFile, writeTextFile } from '../utils/file'
import { buildPageLocaleRelativeFile, parsePageScopeFromRelativeFile } from '../utils/page-file'

type CsvRow = [string, string, string]

function appendFlatRows(rows: CsvRow[], file: string, values: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) {
    rows.push([file, key, value])
  }
}

function buildRowsForLocale(project: I18nProject, localeCode: string): CsvRow[] {
  const localeSet = project.getLocale(localeCode)
  const rows: CsvRow[] = []

  appendFlatRows(rows, `${localeCode}.json`, localeSet.getFlatGlobalKeys())

  for (const pageScope of localeSet.getPageScopes()) {
    const relativeFile = buildPageLocaleRelativeFile(pageScope, localeCode)
    appendFlatRows(rows, relativeFile, localeSet.getFlatPageKeys(pageScope))
  }

  return rows
}

export async function exportProjectToCsv(project: I18nProject, csvDir: string): Promise<void> {
  ensureDirectoryExists(csvDir)

  for (const localeCode of project.getLocaleCodes()) {
    const rows = buildRowsForLocale(project, localeCode)
    const csvContent = stringify(rows, {
      header: true,
      columns: ['File', 'Key', 'Translation'],
    })
    writeTextFile(join(csvDir, `${localeCode}.csv`), csvContent)
  }
}

export async function importProjectFromCsv(project: I18nProject, csvDir: string): Promise<void> {
  for (const localeCode of project.getLocaleCodes()) {
    const csvPath = join(csvDir, `${localeCode}.csv`)
    if (!pathExists(csvPath)) {
      continue
    }

    const csvContent = readTextFile(csvPath)
    const records = parse(csvContent, {
      columns: ['File', 'Key', 'Translation'],
      skip_empty_lines: true,
      from_line: 2,
    }) as Array<{ File: string, Key: string, Translation: string }>

    const localeSet = project.getLocale(localeCode)
    for (const record of records) {
      const pageScope = parsePageScopeFromRelativeFile(record.File, localeCode)
      if (pageScope) {
        localeSet.setValue(record.Key, record.Translation, pageScope)
      }
      else {
        localeSet.setValue(record.Key, record.Translation, 'global')
      }
    }
  }

  await project.save()
}
