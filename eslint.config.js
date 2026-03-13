// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true,
  },
  dirs: {
    src: [
      './playground',
    ],
  },
}).append({
  ignores: [
    '.tmp/**',
    'coverage/**',
    'agent-tools/**',
    '.cursor/**',
    '.nuxt/**',
    '.output/**',
    '.idea/**',
    'dist/**',
    'tests/fixtures/**',
  ],
}).append({
  rules: {
    'vue/singleline-html-element-content-newline': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'all',
      caughtErrorsIgnorePattern: '^_',
    }],
    'vue/no-v-html': 'off',
  },
})
