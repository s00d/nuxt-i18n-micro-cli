// Common text patterns for different file types
export const TEXT_PATTERNS = {
  // Template literals, single quotes, double quotes
  QUOTED_TEXT: /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,

  // Vue template text nodes
  VUE_TEMPLATE_TEXT: />([^<]+)</g,

  // Vue v-text directive
  VUE_V_TEXT: /v-text=(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,

  // Text content in attributes
  ATTRIBUTE_TEXT: /\b(?:title|label|placeholder|alt)=(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,

  // Common UI text patterns
  UI_PATTERNS: [
    /\berror\s*:\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/gi,
    /\.value\s*=\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,
    /\bmessage\s*:\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/gi,
  ],
}

// Template expression patterns
export const TEMPLATE_EXPRESSIONS = {
  // Match translation and special functions
  TRANSLATION: /\{\{\s*\$t\([^)]+\)\s*\}\}/,
  SPECIAL_FUNCTIONS: /\{\{\s*\$(?:getLocale|getRouteName|has)\b[^}]*\}\}/,
  // Match both {{ ... }} and {!! ... !!} expressions
  CURLY_EXPRESSIONS: /\{\{[^}]*\}\}|\{!![^!]*!!\}/g,
}
