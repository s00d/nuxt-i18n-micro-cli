import path from 'node:path'
import fs from 'node:fs'
import { NodeTypes, baseParse } from '@vue/compiler-dom'
import { parse } from '@vue/compiler-sfc'
import fastGlob from 'fast-glob'
import { parseSync } from 'oxc-parser'
import { kebabCase, pascalCase, snakeCase } from 'scule'

interface TranslationData {
  pageSpecific: Record<string, Set<string>>
  global: Set<string>
  warnings: Array<{ file: string, expression: string }>
}

function normalizeKeySegment(value: string): string {
  return snakeCase(value.replace(/\[.*?\]/g, ''))
    .replace(/\W/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

function extractComponentTagNames(content: string): string[] {
  const matches = content.match(/<([A-Z][a-zA-Z0-9]*|[a-z]+(?:-[a-z]+)+)/g) || []
  return matches.map(tag => tag.replace('<', '').toLowerCase())
}

function collectReferencedComponentKeys(
  content: string,
  componentNames: Record<string, string[]>,
  visited: Set<string>,
): Set<string> {
  const keys = new Set<string>()
  const componentTags = extractComponentTagNames(content)
  for (const componentName of componentTags) {
    const componentFiles = findComponentsInContent(componentName, componentNames)
    for (const componentFile of componentFiles) {
      const nestedKeys = findComponentsAndExtractKeys(componentFile, componentNames, visited)
      nestedKeys.forEach(key => keys.add(key))
    }
  }
  return keys
}

function readUtf8File(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8')
}

export function toSnakeCase(name: string): string {
  const fileName = path.basename(name, '.vue')
  const dirPath = path.dirname(name)
  const dirName = path.basename(dirPath)

  if (fileName === 'index') {
    return normalizeKeySegment(dirName)
  }

  if (dirName === 'pages' || dirName === 'components') {
    return normalizeKeySegment(fileName)
  }

  const componentName = normalizeKeySegment(fileName)

  return `${normalizeKeySegment(dirName)}_${componentName}`
}

export function extractKeys(content: string): Set<string> {
  return analyzeTranslationCalls(content).keys
}

export function extractDynamicKeyWarnings(content: string): string[] {
  return analyzeTranslationCalls(content).dynamicExpressions
}

function analyzeTranslationCalls(content: string): { keys: Set<string>, dynamicExpressions: string[] } {
  const keys = new Set<string>()
  const dynamicExpressions = new Set<string>()
  if (isVueSfc(content)) {
    extractKeysFromVueSfc(content, keys, dynamicExpressions)
  }
  else {
    extractKeysFromCode(content, keys, dynamicExpressions)
  }
  return {
    keys,
    dynamicExpressions: [...dynamicExpressions],
  }
}

function isVueSfc(content: string): boolean {
  return /<template[\s>]/.test(content) || /<script[\s>]/.test(content)
}

function extractKeysFromVueSfc(content: string, keys: Set<string>, dynamicExpressions: Set<string>): void {
  const parsed = parse(content)
  const template = parsed.descriptor.template?.content
  const script = parsed.descriptor.script?.content
  const scriptSetup = parsed.descriptor.scriptSetup?.content

  if (template) {
    extractKeysFromVueTemplate(template, keys, dynamicExpressions)
  }
  if (script) {
    extractKeysFromCode(script, keys, dynamicExpressions)
  }
  if (scriptSetup) {
    extractKeysFromCode(scriptSetup, keys, dynamicExpressions)
  }
}

function extractKeysFromVueTemplate(template: string, keys: Set<string>, dynamicExpressions: Set<string>): void {
  const ast = baseParse(template, { comments: false })
  walkVueAst(ast, keys, dynamicExpressions)
}

function walkVueAst(node: unknown, keys: Set<string>, dynamicExpressions: Set<string>): void {
  if (!node || typeof node !== 'object') {
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walkVueAst(item, keys, dynamicExpressions)
    }
    return
  }

  const asRecord = node as Record<string, unknown>
  const type = asRecord.type

  if (type === NodeTypes.INTERPOLATION) {
    const expression = getNestedString(asRecord, ['content', 'loc', 'source'])
    if (expression) {
      extractKeysFromExpression(expression, keys, dynamicExpressions)
    }
  }

  if (type === NodeTypes.DIRECTIVE) {
    const expression = getNestedString(asRecord, ['exp', 'loc', 'source'])
    if (expression) {
      extractKeysFromExpression(expression, keys, dynamicExpressions)
    }
  }

  for (const value of Object.values(asRecord)) {
    walkVueAst(value, keys, dynamicExpressions)
  }
}

function extractKeysFromExpression(expression: string, keys: Set<string>, dynamicExpressions: Set<string>): void {
  const wrapped = `const __i18n_expr__ = (${expression})`
  extractKeysFromCode(wrapped, keys, dynamicExpressions)
}

function extractKeysFromCode(code: string, keys: Set<string>, dynamicExpressions: Set<string>): void {
  try {
    const result = parseSync('inline.js', code, {
      lang: 'js',
      sourceType: 'unambiguous',
    })
    walkJavaScriptAst(result.program as unknown, keys, dynamicExpressions)
  }
  catch {
    // Keep extraction resilient for broken snippets.
  }
}

function walkJavaScriptAst(node: unknown, keys: Set<string>, dynamicExpressions: Set<string>): void {
  if (!node || typeof node !== 'object') {
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walkJavaScriptAst(item, keys, dynamicExpressions)
    }
    return
  }

  const asRecord = node as Record<string, unknown>
  if (asRecord.type === 'CallExpression') {
    const key = extractTranslationKeyFromCall(asRecord, dynamicExpressions)
    if (key) {
      keys.add(key)
    }
  }

  for (const value of Object.values(asRecord)) {
    walkJavaScriptAst(value, keys, dynamicExpressions)
  }
}

function extractTranslationKeyFromCall(
  call: Record<string, unknown>,
  dynamicExpressions: Set<string>,
): string | null {
  const callee = call.callee
  if (!isTranslationCallee(callee)) {
    return null
  }

  const args = call.arguments
  if (!Array.isArray(args) || args.length === 0) {
    return null
  }

  const staticKey = readStringArgument(args[0])
  if (staticKey) {
    return staticKey
  }

  const expression = readArgumentSource(args[0])
  if (expression) {
    dynamicExpressions.add(expression)
  }

  return null
}

function isTranslationCallee(callee: unknown): boolean {
  if (!callee || typeof callee !== 'object') {
    return false
  }

  const asRecord = callee as Record<string, unknown>
  if (asRecord.type === 'Identifier') {
    return asRecord.name === '$t' || asRecord.name === '$tc'
  }

  if (asRecord.type === 'MemberExpression' || asRecord.type === 'StaticMemberExpression' || asRecord.type === 'ComputedMemberExpression') {
    const property = asRecord.property
    if (property && typeof property === 'object') {
      const propertyRecord = property as Record<string, unknown>
      return propertyRecord.type === 'Identifier'
        && (propertyRecord.name === '$t' || propertyRecord.name === '$tc')
    }
  }

  return false
}

function readStringArgument(argument: unknown): string | null {
  if (!argument || typeof argument !== 'object') {
    return null
  }

  const asRecord = argument as Record<string, unknown>

  if (asRecord.type === 'Literal' && typeof asRecord.value === 'string') {
    return asRecord.value
  }

  if (asRecord.type === 'StringLiteral' && typeof asRecord.value === 'string') {
    return asRecord.value
  }

  if (asRecord.type === 'TemplateLiteral') {
    const expressions = asRecord.expressions
    const quasis = asRecord.quasis
    if (Array.isArray(expressions) && expressions.length === 0 && Array.isArray(quasis)) {
      const first = quasis[0]
      if (first && typeof first === 'object') {
        const cooked = getNestedString(first as Record<string, unknown>, ['value', 'cooked'])
        if (typeof cooked === 'string') {
          return cooked
        }
      }
    }
  }

  return null
}

function readArgumentSource(argument: unknown): string | null {
  if (!argument || typeof argument !== 'object') {
    return null
  }
  const asRecord = argument as Record<string, unknown>
  const source = getNestedString(asRecord, ['loc', 'lines', 'infos', '0', 'line'])
  if (source) {
    return source.trim()
  }
  if (typeof asRecord.type === 'string') {
    return `[${asRecord.type}]`
  }
  return '[dynamic-expression]'
}

function getNestedString(source: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = source
  for (const segment of path) {
    if (!current || typeof current !== 'object') {
      return null
    }
    current = (current as Record<string, unknown>)[segment]
  }
  return typeof current === 'string' ? current : null
}

export function getComponentNames(componentDir: string): Record<string, string[]> {
  const componentFiles = fastGlob.sync('**/*.{js,ts,vue}', { cwd: componentDir, ignore: ['node_modules/**'] })
  const componentNames: Record<string, string[]> = {}

  componentFiles.forEach((file) => {
    const relativePath = path.relative(componentDir, file)
    const componentName = path.basename(file, path.extname(file))

    const dirParts = path.dirname(relativePath).split(path.sep).filter(part => part.trim().length > 0 && part !== '..')

    const fullNameParts = [...dirParts, componentName]

    const kebabCaseName = fullNameParts
      .map(part => kebabCase(part))
      .join('-')
    const pascalCaseName = fullNameParts
      .map(part => pascalCase(part))
      .join('')

    componentNames[path.join(componentDir, file)] = [kebabCaseName, pascalCaseName]
  })

  return componentNames
}

export function findComponentsAndExtractKeys(componentPath: string, componentNames: Record<string, string[]>, visited: Set<string>): Set<string> {
  const keys = new Set<string>()

  if (visited.has(componentPath)) {
    return keys
  }

  visited.add(componentPath)

  const content = readUtf8File(componentPath)
  const componentKeys = extractKeys(content)
  componentKeys.forEach(key => keys.add(key))

  const referencedKeys = collectReferencedComponentKeys(content, componentNames, visited)
  referencedKeys.forEach(key => keys.add(key))

  return keys
}

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

export function extractTranslations(cwd: string): TranslationData {
  const translationData: TranslationData = {
    pageSpecific: {},
    global: new Set<string>(),
    warnings: [],
  }

  const pageFiles = fastGlob.sync('pages/**/*.{js,ts,vue}', { cwd, ignore: ['node_modules/**'] })
  const globalFiles = fastGlob.sync('{layouts,components,plugins,composables}/**/*.{js,ts,vue}', { cwd, ignore: ['node_modules/**'] })

  const componentDir = path.resolve(cwd, 'components')
  const componentNames = getComponentNames(componentDir)

  pageFiles.forEach((file) => {
    const pagePath = path.join(cwd, file)
    const content = readUtf8File(pagePath)
    const relativePath = path.relative('pages', file).replace(/\.[jt]s$/, '')
    const pageKey = toSnakeCase(relativePath)
    const keys = extractKeys(content)
    const warnings = extractDynamicKeyWarnings(content)
    for (const warning of warnings) {
      translationData.warnings.push({
        file: pagePath,
        expression: warning,
      })
    }

    const componentKeys = collectReferencedComponentKeys(content, componentNames, new Set())
    componentKeys.forEach(key => keys.add(key))

    translationData.pageSpecific[pageKey] = keys
  })

  globalFiles.forEach((file) => {
    const fullPath = path.join(cwd, file)
    const content = readUtf8File(fullPath)
    const keys = extractKeys(content)
    keys.forEach(key => translationData.global.add(key))
    const warnings = extractDynamicKeyWarnings(content)
    for (const warning of warnings) {
      translationData.warnings.push({
        file: fullPath,
        expression: warning,
      })
    }
  })

  return translationData
}
