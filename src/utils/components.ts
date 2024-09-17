import path from 'node:path'
import fs from 'node:fs'
import glob from 'glob'

interface TranslationData {
  pageSpecific: Record<string, Set<string>>
  global: Set<string>
}

// Функция для преобразования путей к файлам в формат snake_case
export function toSnakeCase(name: string): string {
  return name
    .replace(/\.vue$/, '') // Удаляем расширение .vue
    .replace(/\//g, '-') // Заменяем слеши на тире
    .replace(/\[.*?\]/g, '') // Удаляем квадратные скобки и их содержимое
    .replace(/[^\w\s-]/g, '') // Удаляем все символы, кроме букв, цифр, тире и пробелов
    .replace(/\s+/g, '_') // Заменяем пробелы на подчёркивания
    .replace(/-{2,}/g, '-') // Объединяем несколько тире в одно
    .replace(/-$|^-/g, '') // Удаляем тире в начале и в конце
    .replace(/-index/g, '') // Удаляем тире в начале и в конце
    .toLowerCase() // Преобразуем в нижний регистр
}

// Функция для извлечения ключей из содержимого файла
export function extractKeys(content: string): Set<string> {
  const keys = new Set<string>()
  const tRegex = /\$t\(['"`]([^'"`]+)['"`]\)/g
  const tcRegex = /\$tc\(['"`]([^'"`]+)['"`],\s*\d+\)/g

  let match
  while ((match = tRegex.exec(content)) !== null) {
    keys.add(match[1])
  }
  while ((match = tcRegex.exec(content)) !== null) {
    keys.add(match[1])
  }

  return keys
}

// Функция для получения всех компонентов и формирования возможных названий
export function getComponentNames(componentDir: string): Record<string, string[]> {
  const componentFiles = glob.sync('**/*.{js,ts,vue}', { cwd: componentDir, ignore: 'node_modules/**' })
  const componentNames: Record<string, string[]> = {}

  componentFiles.forEach((file) => {
    const relativePath = path.relative(componentDir, file)
    const componentName = path.basename(file, path.extname(file)) // Имя файла без расширения

    // Разделяем путь на части и исключаем пустые части и '..'
    const dirParts = path.dirname(relativePath).split(path.sep).filter(part => part.trim().length > 0 && part !== '..')

    const fullNameParts = [...dirParts, componentName] // Комбинируем подпапки и имя файла

    // Формируем имена в kebab-case и PascalCase
    const kebabCaseName = fullNameParts
      .map(part => part.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()) // Преобразуем в kebab-case
      .join('-')
    const pascalCaseName = fullNameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // Преобразуем в PascalCase
      .join('')

    componentNames[path.join(componentDir, file)] = [kebabCaseName, pascalCaseName]
  })

  return componentNames
}

// Рекурсивная функция для поиска компонентов и извлечения их переводов
export function findComponentsAndExtractKeys(componentPath: string, componentNames: Record<string, string[]>, visited: Set<string>): Set<string> {
  const keys = new Set<string>()

  if (visited.has(componentPath)) {
    return keys // Избегаем бесконечной рекурсии при циклических зависимостях
  }

  visited.add(componentPath)

  const content = fs.readFileSync(componentPath, 'utf8')
  const componentKeys = extractKeys(content)
  componentKeys.forEach(key => keys.add(key))

  const componentMatches = content.match(/<([A-Z][a-zA-Z0-9]*|[a-z]+(?:-[a-z]+)+)/g) || []

  componentMatches.forEach((componentTag) => {
    const componentName = componentTag.replace('<', '').toLowerCase()
    const componentFiles = findComponentsInContent(componentName, componentNames)

    componentFiles.forEach((nestedComponentPath) => {
      const nestedKeys = findComponentsAndExtractKeys(nestedComponentPath, componentNames, visited)
      nestedKeys.forEach(key => keys.add(key))
    })
  })

  return keys
}

// Функция для поиска компонентов в содержимом с учетом возможных названий
export function findComponentsInContent(content: string, componentNames: Record<string, string[]>): string[] {
  const foundComponents: string[] = []

  Object.entries(componentNames).forEach(([componentPath, names]) => {
    names.forEach((name) => {
      if (content === name) {
        foundComponents.push(componentPath)
      }
    })
  })

  return foundComponents
}

// Функция для извлечения всех переводов из проекта
export function extractTranslations(cwd: string): TranslationData {
  const translationData: TranslationData = {
    pageSpecific: {},
    global: new Set<string>(),
  }

  // Сканируем папки для переводов
  const pageFiles = glob.sync('pages/**/*.{js,ts,vue}', { cwd, ignore: 'node_modules/**' })
  const globalFiles = glob.sync('{layouts,components,plugins,composables}/**/*.{js,ts,vue}', { cwd, ignore: 'node_modules/**' })

  // Получаем имена компонентов
  const componentDir = path.resolve(cwd, 'components')
  const componentNames = getComponentNames(componentDir)

  // Сканируем страницы
  pageFiles.forEach((file) => {
    const content = fs.readFileSync(path.join(cwd, file), 'utf8')
    const relativePath = path.relative('pages', file).replace(/\.[jt]s$/, '')
    const pageKey = toSnakeCase(relativePath)
    const keys = extractKeys(content)

    const componentMatches = content.match(/<([A-Z][a-zA-Z0-9]*|[a-z]+(?:-[a-z]+)+)/g) || []

    componentMatches.forEach((componentTag) => {
      const componentName = componentTag.replace('<', '').toLowerCase()
      const componentFiles = findComponentsInContent(componentName, componentNames)

      componentFiles.forEach((componentFile) => {
        const componentKeys = findComponentsAndExtractKeys(componentFile, componentNames, new Set())
        componentKeys.forEach(key => keys.add(key))
      })
    })

    translationData.pageSpecific[pageKey] = keys
  })

  // Сканируем глобальные файлы
  globalFiles.forEach((file) => {
    const content = fs.readFileSync(path.join(cwd, file), 'utf8')
    const keys = extractKeys(content)
    keys.forEach(key => translationData.global.add(key))
  })

  return translationData
}
