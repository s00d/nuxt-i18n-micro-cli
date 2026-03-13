import type { I18nProject } from '../Project'

export interface ReplaceValuesOptions {
  search: string
  replace: string
  useRegex: boolean
}

function replaceWithGroups(source: string, pattern: RegExp, replacement: string): string {
  return source.replace(pattern, (_match, ...groups) => {
    return replacement.replace(/\$(\d+)/g, (_, groupIndex) => groups[Number(groupIndex) - 1] || '')
  })
}

function replaceValue(value: string, options: ReplaceValuesOptions, searchPattern: RegExp | string): string {
  return options.useRegex
    ? replaceWithGroups(value, searchPattern as RegExp, options.replace)
    : value.replace(searchPattern as string, options.replace)
}

function applyReplacements(
  entries: Record<string, string>,
  apply: (key: string, value: string) => void,
  options: ReplaceValuesOptions,
  searchPattern: RegExp | string,
): number {
  let updatedCount = 0
  for (const [key, value] of Object.entries(entries)) {
    const newValue = replaceValue(value, options, searchPattern)
    if (newValue !== value) {
      apply(key, newValue)
      updatedCount++
    }
  }
  return updatedCount
}

export function replaceProjectValues(project: I18nProject, options: ReplaceValuesOptions): number {
  const searchPattern = options.useRegex ? new RegExp(options.search, 'g') : options.search
  let updatedCount = 0

  for (const localeCode of project.getLocaleCodes()) {
    const localeSet = project.getLocale(localeCode)
    updatedCount += applyReplacements(
      localeSet.getFlatGlobalKeys(),
      (key, value) => localeSet.setValue(key, value, 'global'),
      options,
      searchPattern,
    )

    for (const pageScope of localeSet.getPageScopes()) {
      updatedCount += applyReplacements(
        localeSet.getFlatPageKeys(pageScope),
        (key, value) => localeSet.setValue(key, value, pageScope),
        options,
        searchPattern,
      )
    }
  }

  return updatedCount
}
