import fastGlob from 'fast-glob'

const SOURCE_DIRS = ['pages', 'components', 'plugins', 'layouts']
const SOURCE_PATTERNS = ['**/*.vue', '**/*.js', '**/*.ts']

export function collectProjectSourceFiles(cwd: string): string[] {
  return SOURCE_DIRS.flatMap(dir =>
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
