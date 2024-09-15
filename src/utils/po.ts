import path from 'node:path'
import fs from 'node:fs'
import gettextParser from 'gettext-parser'
import glob from 'glob'
import { keyToNestedObject, writeJsonFile } from './json'

export function poToJson(poContent: string): Record<string, unknown> {
  const parsed = gettextParser.po.parse(poContent)
  const translations: Record<string, unknown> = {}

  // Преобразование данных из PO в JSON структуру
  for (const [msgctxt, contexts] of Object.entries(parsed.translations)) {
    for (const [msgid, translation] of Object.entries(contexts)) {
      if (msgid === '') continue // Пропускаем пустые строки (заголовок)
      if (translation.msgstr) {
        const key = msgctxt ? `${msgctxt}.${msgid}` : msgid // Используем контекст, если он есть
        translations[key] = translation.msgstr[0] || ''
      }
    }
  }

  // Преобразование ключей в вложенные объекты
  const nestedTranslations: Record<string, unknown> = {}
  Object.keys(translations).forEach((key) => {
    const value = translations[key]
    Object.assign(nestedTranslations, keyToNestedObject(key, value))
  })

  return nestedTranslations
}

// Функция для преобразования PO файлов обратно в JSON формат
export function convertPoToJson(potsDir: string, translationDir: string): void {
  const poFiles = glob.sync('**/*.po', { cwd: potsDir })

  poFiles.forEach((poFile) => {
    const poFilePath = path.join(potsDir, poFile)
    const poContent = fs.readFileSync(poFilePath, 'utf8')
    const jsonContent = poToJson(poContent)

    // Определяем путь сохранения JSON файла в translationDir
    const jsonFilePath = path.join(
      translationDir,
      poFile.replace(/\.po$/, '.json'), // Оставляем путь без изменения 'pages' на полный путь
    )

    // Записываем JSON данные в файл
    writeJsonFile(jsonFilePath, jsonContent)
  })
}

export function convertToPO(translations: Record<string, unknown>): Buffer {
  const poData = {
    charset: 'utf-8',
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
    translations: {
      '': {} as Record<string, { msgid: string, msgstr: string[] }>, // Явное указание типа
    },
  }

  const traverse = (obj: Record<string, unknown>, path: string[] = []): void => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path.concat(key)
      const msgid = currentPath.join('.')

      if (typeof value === 'string') {
        poData.translations[''][msgid] = {
          msgid,
          msgstr: [value],
        }
      }
      else if (typeof value === 'object' && value !== null) {
        traverse(value as Record<string, unknown>, currentPath)
      }
    }
  }

  traverse(translations)

  return gettextParser.po.compile(poData)
}
