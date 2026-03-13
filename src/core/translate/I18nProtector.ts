export interface ProtectedText {
  maskedText: string
  dictionary: string[]
}

const PLACEHOLDER_PATTERN = /(%?\{[^{}]+\}|\{\{[^{}]+\}\}|@:[\w.-]+)/g

export class I18nProtector {
  protect(text: string): ProtectedText {
    const dictionary: string[] = []
    let counter = 0

    const maskedText = text.replace(PLACEHOLDER_PATTERN, (match) => {
      dictionary.push(match)
      return `<v${counter++}/>`
    })

    return { maskedText, dictionary }
  }

  restore(maskedText: string, dictionary: string[]): string {
    let restoredText = maskedText

    for (const [index, originalValue] of dictionary.entries()) {
      const selfClosingTag = new RegExp(`<v${index}\\s*/\\s*>`, 'gi')
      const pairedTag = new RegExp(`<v${index}\\s*>\\s*<\\/v${index}\\s*>`, 'gi')
      restoredText = restoredText
        .replace(selfClosingTag, originalValue)
        .replace(pairedTag, originalValue)
    }

    return restoredText
  }
}

export function splitPluralForms(text: string, separator = '|'): string[] {
  if (!separator || !text.includes(separator)) {
    return [text]
  }

  return text.split(separator).map(part => part.trim())
}
