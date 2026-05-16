import fastGlob from 'fast-glob'

/** Nuxt 3 (root) and Nuxt 4 (`app/`) source roots scanned by `text-to-i18n` and related commands. */
export const PROJECT_SOURCE_DIRS = [
  'pages',
  'components',
  'plugins',
  'layouts',
  'app/pages',
  'app/components',
  'app/plugins',
  'app/layouts',
] as const

const SOURCE_PATTERNS = ['**/*.vue', '**/*.js', '**/*.ts']

export function collectProjectSourceFiles(cwd: string): string[] {
  return PROJECT_SOURCE_DIRS.flatMap(dir =>
    SOURCE_PATTERNS.flatMap(pattern =>
      fastGlob.sync(`${dir}/${pattern}`, {
        cwd,
        absolute: true,
      }),
    ),
  )
}

export function collectSourceFilesInDirectory(directory: string): string[] {
  return fastGlob.sync('**/*.{vue,js,ts}', {
    cwd: directory,
    absolute: true,
  })
}
