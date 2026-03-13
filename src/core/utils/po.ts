import path from 'node:path'
import fs from 'node:fs'
import * as gettextParser from 'gettext-parser'
import fastGlob from 'fast-glob'
import { unflatten } from 'flat'
import { flattenKeyValueEntries, writeJsonFile } from './json'

export function poToJson(poContent: string): Record<string, unknown> {
  const parsed = gettextParser.po.parse(poContent) as {
    translations: Record<string, Record<string, { msgstr?: string[] }>>
  }
  const translations: Record<string, unknown> = {}

  for (const [msgctxt, contexts] of Object.entries(parsed.translations)) {
    for (const [msgid, translation] of Object.entries(contexts)) {
      if (msgid === '') continue
      if (translation.msgstr) {
        const key = msgctxt ? `${msgctxt}.${msgid}` : msgid
        translations[key] = translation.msgstr[0] || ''
      }
    }
  }

  return unflatten(translations, { delimiter: '.', object: true }) as Record<string, unknown>
}

export function convertPoToJson(potsDir: string, translationDir: string): void {
  const poFiles = fastGlob.sync('**/*.po', { cwd: potsDir })

  poFiles.forEach((poFile) => {
    const poFilePath = path.join(potsDir, poFile)
    const poContent = fs.readFileSync(poFilePath, 'utf8')
    const jsonContent = poToJson(poContent)

    const jsonFilePath = path.join(
      translationDir,
      poFile.replace(/\.po$/, '.json'),
    )

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
      '': {} as Record<string, { msgid: string, msgstr: string[] }>,
    },
  }

  for (const [msgid, value] of flattenKeyValueEntries(translations)) {
    if (typeof value !== 'string') {
      continue
    }

    poData.translations[''][msgid] = {
      msgid,
      msgstr: [value],
    }
  }

  return gettextParser.po.compile(poData)
}
