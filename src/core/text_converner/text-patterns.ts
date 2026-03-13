export const TEXT_PATTERNS = {
  QUOTED_TEXT: /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,
  VUE_TEMPLATE_TEXT: />([^<]+)</g,
  VUE_V_TEXT: /v-text=(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,
  ATTRIBUTE_TEXT: /\b(?:title|label|placeholder|alt)=(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,
  UI_PATTERNS: [
    /\berror\s*:\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/gi,
    /\.value\s*=\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,
    /\bmessage\s*:\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/gi,
  ],
}

export const TEMPLATE_EXPRESSIONS = {
  TRANSLATION: /\{\{\s*\$t\([^)]+\)\s*\}\}/,
  SPECIAL_FUNCTIONS: /\{\{\s*\$(?:getLocale|getRouteName|has)\b[^}]*\}\}/,
  CURLY_EXPRESSIONS: /\{\{[^}]*\}\}|\{!![^!]*!!\}/g,
}
