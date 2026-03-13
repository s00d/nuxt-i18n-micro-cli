import { I18nProtector } from '../translate/I18nProtector'
import type { I18nProject } from '../Project'

export interface GeneratePseudoLocaleOptions {
  sourceLocale: string
  targetLocale: string
  replace?: boolean
}

export interface GeneratePseudoLocaleResult {
  sourceLocale: string
  targetLocale: string
  updatedKeys: number
  skippedKeys: number
}

const i18nProtector = new I18nProtector()

const CHAR_MAP: Record<string, string> = {
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  e: 'e',
  f: 'f',
  g: 'g',
  h: 'h',
  i: 'i',
  j: 'j',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  o: 'o',
  p: 'p',
  q: 'q',
  r: 'r',
  s: 's',
  t: 't',
  u: 'u',
  v: 'v',
  w: 'w',
  x: 'x',
  y: 'y',
  z: 'z',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  H: 'H',
  I: 'I',
  J: 'J',
  K: 'K',
  L: 'L',
  M: 'M',
  N: 'N',
  O: 'O',
  P: 'P',
  Q: 'Q',
  R: 'R',
  S: 'S',
  T: 'T',
  U: 'U',
  V: 'V',
  W: 'W',
  X: 'X',
  Y: 'Y',
  Z: 'Z',
}

function elongate(text: string): string {
  const tokens = text.split(/(<v\d+\s*\/\s*>)/g)
  return tokens
    .map((chunk) => {
      if (/^<v\d+\s*\/\s*>$/.test(chunk)) {
        return chunk
      }
      return chunk
        .split('')
        .map((char) => {
          if (!/[a-z]/i.test(char)) {
            return char
          }
          const mapped = CHAR_MAP[char] ?? char
          return `${mapped}${mapped}`
        })
        .join('')
    })
    .join('')
}

export function pseudoLocalizeText(text: string): string {
  const protectedText = i18nProtector.protect(text)
  const pseudo = `[${elongate(protectedText.maskedText)}]`
  return i18nProtector.restore(pseudo, protectedText.dictionary)
}

export function generatePseudoLocale(
  project: I18nProject,
  options: GeneratePseudoLocaleOptions,
): GeneratePseudoLocaleResult {
  if (options.sourceLocale === options.targetLocale) {
    throw new Error('Source and target locale must be different')
  }

  const source = project.getLocale(options.sourceLocale)
  const target = project.getLocale(options.targetLocale)
  const replace = Boolean(options.replace)
  let updatedKeys = 0
  let skippedKeys = 0

  for (const [key, value] of Object.entries(source.getFlatGlobalKeys())) {
    const currentTarget = target.getValue(key, 'global')
    if (!replace && typeof currentTarget === 'string' && currentTarget.trim().length > 0) {
      skippedKeys += 1
      continue
    }
    target.setValue(key, pseudoLocalizeText(value), 'global')
    updatedKeys += 1
  }

  for (const pageScope of source.getPageScopes()) {
    for (const [key, value] of Object.entries(source.getFlatPageKeys(pageScope))) {
      const currentTarget = target.getValue(key, pageScope)
      if (!replace && typeof currentTarget === 'string' && currentTarget.trim().length > 0) {
        skippedKeys += 1
        continue
      }
      target.setValue(key, pseudoLocalizeText(value), pageScope)
      updatedKeys += 1
    }
  }

  return {
    sourceLocale: options.sourceLocale,
    targetLocale: options.targetLocale,
    updatedKeys,
    skippedKeys,
  }
}
