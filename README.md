# Nuxt i18n CLI


## 📖 Introduction

`nuxt-i18n-micro-cli` is a command-line tool designed to streamline the localization and internationalization process in Nuxt.js projects using the `nuxt-i18n` module. It provides utilities to extract translation keys from your codebase, manage translation files, synchronize translations across locales, and automate the translation process using external translation services.

This guide will walk you through installing, configuring, and using `nuxt-i18n-micro-cli` to effectively manage your project's translations.

## 🔧 Installation and Setup

### 📦 Installing nuxt-i18n-micro-cli

Install `nuxt-i18n-micro-cli` globally using npm:

```bash
npm install -g nuxt-i18n-micro-cli
```

This will make the `i18n-micro` command available globally on your system.

### 🛠 Initializing in Your Project

After installing, you can run `i18n-micro` commands in your Nuxt.js project directory.

Ensure that your project is set up with `nuxt-i18n` and has the necessary configuration in `nuxt.config.js`.


For detailed documentation and further configuration options, visit the [nuxt-i18n-micro CLI guide](https://s00d.github.io/nuxt-i18n-micro/guide/cli).

## 🗂️ Commands and Usage

All commands use this format:

```bash
i18n-micro <command> [options]
```

### 📄 Common Global Options

- `--cwd`: Current working directory.
- `--logLevel`: Log level (`silent`, `info`, `verbose`).

### 🧭 Command Catalog

#### Project Setup & Diagnostics

- `init`: Bootstrap a Nuxt project with i18n wiring.
- `info`: Print CLI/project/environment diagnostics (`--json`, `--debug`).

#### Core Translation Workflow

- `extract`: Extract i18n keys from source files.
- `translate`: Fill missing translations via configured service providers.
- `sync`: Align locale files to reference structure.
- `sync-remote`: Pull/push translations with remote providers.
- `validate`: Check missing/extra keys against reference locale.
- `stats`: Completion metrics, optional git baseline diff (`--baseRef`).
- `lint`: Translation-quality linting with optional autofix.
- `clean`: Remove unused/empty keys with include/exclude filters.
- `search`: Find keys/values/usages/hardcoded text across all Nuxt layers.

#### Refactor & Content Transform

- `text-to-i18n`: Replace hardcoded text with `$t(...)` references.
- `rename`: Safely rename translation keys in locales and source files.
- `replace-values`: Bulk replace values (plain text or regex).
- `pseudo`: Generate pseudo-locale from source locale.
- `optimize`: Optimize dictionaries and optionally update key paths.
- `format`: Normalize/sort translation files.
- `split`: Split large dictionaries by size/depth/prefix.

#### Import / Export / Audit

- `export`: JSON -> PO.
- `import`: PO -> JSON.
- `export-csv`: JSON -> CSV (supports nested/page files).
- `import-csv`: CSV -> JSON.
- `diff`: Show missing keys and baseline values across locales.
- `check-duplicates`: Find duplicate values per locale.

#### Backup, Recovery, Planning

- `backup`: Create encrypted zip backups of translation files.
- `restore`: Restore translations from backup archives.
- `estimate`: Estimate tokens/cost before running `translate`.
- `glossary`: Manage glossary terms (`list`, `add`, `remove`).

### 📋 Command Reference

#### init

**Description**: Initialize a new Nuxt project with `nuxt-i18n-micro`.

**Usage**:

```bash
i18n-micro init
```

#### info

**Description**: Show CLI, project, and environment details.

**Usage**:

```bash
i18n-micro info [--json] [--debug]
```

#### extract

**Description**: Extract translations and organize by scope.

**Usage**:

```bash
i18n-micro extract [--translationDir locales] [--prod]
```

#### translate

**Description**: Automatically translate missing (or all) keys.

**Usage**:

```bash
i18n-micro translate --service <service> --token <token> [options]
```

**Key options**:

- `--translationDir`: Translation root directory.
- `--options`: Service-specific options as `key:value,key:value`.
- `--replace`: Re-translate existing values.
- `--chunkSize`: Batch size for requests.
- `--pluralSeparator`: Plural separator (default `|`).
- `--glossaryFile`: Path to glossary JSON file.

#### sync

**Description**: Synchronize locale files with the reference locale shape.

**Usage**:

```bash
i18n-micro sync [--translationDir locales]
```

#### sync-remote

**Description**: Synchronize with remote storage providers.

**Usage**:

```bash
i18n-micro sync-remote [--pull] [--push] [--force] [--dryRun]
```

#### validate

**Description**: Validate missing and extra keys.

**Usage**:

```bash
i18n-micro validate [--translationDir locales]
```

#### stats

**Description**: Show coverage stats per locale and overall completion.

**Usage**:

```bash
i18n-micro stats [--full] [--json] [--html] [--baseRef <git-ref>]
```

#### lint

**Description**: Run translation-quality checks.

**Usage**:

```bash
i18n-micro lint [--rules key1,key2] [--fix] [--json]
```

#### clean

**Description**: Remove unused and empty keys.

**Usage**:

```bash
i18n-micro clean [--include <regex>] [--exclude <regex>]
```

#### search

**Description**: Deep search in translations and source code with layer awareness.

**Usage**:

```bash
i18n-micro search [query] [options]
```

**Key options**:

- `--caseSensitive`: Case-sensitive matching.
- `--scope`: `global | pages | all`.
- `--onlyUnused`: Show only keys without code usages.
- `--preferUnused`: Rank unused keys above used keys.
- `--hardcodedOnly`: Find source text not present in translations (query optional in this mode).
- `--onlyVue`: Scan only `.vue` files for source-side checks.
- `--limit`: Return top-N ranked matches.
- `--json`: Machine-readable output.

#### rename

**Description**: Safely rename translation key in locale files and source usages.

**Usage**:

```bash
i18n-micro rename --from <old.key> --to <new.key> [--dryRun]
```

#### pseudo

**Description**: Generate pseudo-localized target locale.

**Usage**:

```bash
i18n-micro pseudo --targetLocale <locale> [--sourceLocale <locale>] [--replace]
```

#### estimate

**Description**: Estimate tokens and translation costs.

**Usage**:

```bash
i18n-micro estimate [--replace] [--json]
```

**Key options**:

- `--inputCostPer1kTokens`
- `--outputCostPer1kTokens`
- `--outputTokenRatio`

#### glossary

**Description**: Manage glossary terms used by translation workflows.

**Usage**:

```bash
i18n-micro glossary --action <list|add|remove> [--source ...] [--target ...]
```

#### text-to-i18n

**Description**: Replace hardcoded text in files with translation keys.

**Usage**:

```bash
i18n-micro text-to-i18n [options]
```

**Key options**:

- `--translationFile`
- `--path`
- `--context`
- `--dryRun`
- `--verbose`
- `--extractOnlyDirs`
- `--extractOnlyPatterns` (supports `!pattern` exclusions)
- `--interactive`

#### format

**Description**: Format JSON translation files.

**Usage**:

```bash
i18n-micro format [--indent 2] [--sortKeys]
```

#### split

**Description**: Split large translation files into smaller chunks.

**Usage**:

```bash
i18n-micro split [--maxKeys 100] [--maxDepth 2] [--splitByPrefix] [--outputDir locales/split]
```

#### optimize

**Description**: Analyze and optimize translation structure.

**Usage**:

```bash
i18n-micro optimize [--dryRun] [--json] [--updatePaths]
```

#### import

**Description**: Import PO files into JSON locale files.

**Usage**:

```bash
i18n-micro import [--potsDir pots] [--translationDir locales]
```

#### export

**Description**: Export JSON locale files to PO.

**Usage**:

```bash
i18n-micro export [--potsDir pots] [--translationDir locales]
```

#### import-csv

**Description**: Import CSV files into JSON locale files.

**Usage**:

```bash
i18n-micro import-csv [--csvDir csv_exports] [--translationDir locales]
```

#### export-csv

**Description**: Export JSON locale files to CSV.

**Usage**:

```bash
i18n-micro export-csv [--csvDir csv_exports] [--translationDir locales]
```

#### diff

**Description**: Show locale differences against the default locale.

**Usage**:

```bash
i18n-micro diff [--translationDir locales] [--json]
```

#### check-duplicates

**Description**: Detect duplicate values in translation files.

**Usage**:

```bash
i18n-micro check-duplicates [--translationDir locales]
```

#### replace-values

**Description**: Bulk replace values across all locale files.

**Usage**:

```bash
i18n-micro replace-values --search <pattern> --replace <value> [--useRegex]
```

#### backup

**Description**: Create translation backups (`.zip`) with optional password.

**Usage**:

```bash
i18n-micro backup [--backupDir locales/backups] [--password <password>] [--comment <text>]
```

#### restore

**Description**: Restore locale files from backup archive.

**Usage**:

```bash
i18n-micro restore [--backup <name>] [--backupDir locales/backups] [--password <password>] [--force]
```

### 🛠 Quick Examples

```bash
# Extract keys and sync locale structure
i18n-micro extract && i18n-micro sync

# Translate missing keys via provider
i18n-micro translate --service deepl --token "$DEEPL_TOKEN"

# Find hardcoded UI text in layered project
i18n-micro search "Layer active" --scope all

# Check quality and get machine-readable report
i18n-micro lint --json
```

## ⚙️ Configuration Guide

`nuxt-i18n-micro-cli` relies on your Nuxt.js i18n configuration in `nuxt.config.js`. Ensure you have the `nuxt-i18n` module installed and configured.

### 🔑 nuxt.config.js Example

```js
export default {
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US' },
      { code: 'fr', iso: 'fr-FR' },
      { code: 'es', iso: 'es-ES' },
      // Add other locales as needed
    ],
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
    },
    // Specify the directory where your translation files are stored
    translationDir: 'locales',
  },
};
```

Ensure that the `translationDir` matches the directory used by `nuxt-i18n-micro-cli` (default is `locales`).

### 🌍 Remote Sync Configuration (`sync-remote`)

`sync-remote` reads provider config from:

```text
.i18n-remote.json
```

Common fields:

- `type`: provider id (`github`, `gitlab`, `crowdin`, `lokalise`, `tolgee`, `weblate`, `custom`)
- `url`: provider base/project URL
- `token`: access token (for token-based providers)
- `path`: remote translations path (for git providers) or fallback project id
- `projectId`: explicit project id (recommended for Crowdin/Lokalise/Tolgee/Weblate)
- `branch`: git branch (`main` by default for git providers)
- `languageMapping`: maps local locale code to remote locale code
- `pollIntervalMs`: polling interval for async processes (Crowdin/Lokalise)
- `pollMaxAttempts`: max polling attempts before timeout (Crowdin/Lokalise)

#### GitHub example

```json
{
  "type": "github",
  "url": "https://github.com/acme/my-repo",
  "token": "${GITHUB_TOKEN}",
  "branch": "main",
  "path": "locales",
  "languageMapping": {
    "pt-BR": "pt_BR",
    "zh-CN": "zh_CN"
  }
}
```

#### GitLab example

```json
{
  "type": "gitlab",
  "url": "https://gitlab.com/acme/my-repo",
  "token": "${GITLAB_TOKEN}",
  "branch": "main",
  "path": "locales",
  "languageMapping": {
    "pt-BR": "pt_BR",
    "zh-CN": "zh_CN"
  }
}
```

#### Crowdin example (native build/import with polling)

```json
{
  "type": "crowdin",
  "url": "https://api.crowdin.com",
  "token": "${CROWDIN_TOKEN}",
  "projectId": "123456",
  "languageMapping": {
    "pt-BR": "pt-BR",
    "zh-CN": "zh-CN"
  },
  "pollIntervalMs": 1500,
  "pollMaxAttempts": 120
}
```

#### Lokalise example (native async export/upload with polling)

```json
{
  "type": "lokalise",
  "url": "https://api.lokalise.com/api2",
  "token": "${LOKALISE_TOKEN}",
  "projectId": "123.abc",
  "languageMapping": {
    "pt-BR": "pt_BR",
    "zh-CN": "zh_Hans"
  },
  "pollIntervalMs": 1500,
  "pollMaxAttempts": 120
}
```

Notes:

- `languageMapping` is optional; if omitted, locale codes are used as-is.
- For CI, keep tokens in environment variables/secrets and generate `.i18n-remote.json` during pipeline runtime.
- `pollIntervalMs` and `pollMaxAttempts` are especially useful for large Crowdin/Lokalise projects.

## 🌐 Supported Translation Services

The `translate` command supports the following services (`--service` values):

| Service ID | Provider | `--token` | Important `--options` |
| --- | --- | --- | --- |
| `google` | Google Cloud Translate | required | `projectId`, `googleProjectId`, `apiEndpoint`, `googleApiEndpoint`, `format`, `model` |
| `deepl` | DeepL | required | `formality`, `glossary_id`, `glossary`, `context`, `modelType`, `model_type`, `deeplServerUrl` |
| `yandex` | Yandex Translate (legacy API) | required | passed as request params |
| `ai` | Vercel AI SDK (gateway or any `@ai-sdk/*` provider package) | required (or provider env var) | `provider` (default `gateway`), `model`, `providerPackage`, `providerFactory`, `maxTokens`/`max_tokens`, `temperature`, `topP`/`top_p`, `timeoutMs`, `retries` |
| `azure` | Azure AI Translator | required | `endpoint`, `azureEndpoint`, `region`, `azureRegion` |
| `ibm` | IBM Watson Language Translator | required | `url`, `serviceUrl`, `ibmUrl`, `version`, `ibmVersion` |
| `baidu` | Baidu | required | `appId` (or legacy token format `appId:apiKey`) |
| `googlefree` | Google Free (`@vitalets/google-translate-api`) | optional | `host`, `timeout`, `timeoutMs` |
| `libretranslate` | LibreTranslate | optional/required (depends on instance) | `baseUrl` |
| `mymemory` | MyMemory | optional | no required extra options |
| `lingvatranslate` | Lingva Translate (public API) | not used | no required extra options |
| `papago` | Naver Papago | required | `clientId` (or legacy token format `clientId:clientSecret`) |
| `tencent` | Tencent Cloud TMT | required | `secretId`, `region` (or legacy token format `secretId:secretKey`) |
| `systran` | Systran | required | no required extra options |
| `yandexcloud` | Yandex Cloud Translate | required | `folderId` (required), optional `model` |
| `modernmt` | ModernMT | required | no required extra options |
| `lilt` | Lilt | required | `baseUrl` |
| `unbabel` | Unbabel | required | `username` (required), optional `baseUrl` |
| `reverso` | Reverso | not used | no required extra options |

### ⚙️ Service Configuration

Use `--options` as comma-separated `key:value` pairs:

```bash
--options key1:value1,key2:value2
```

Examples:

```bash
# AI SDK (Vercel AI Gateway — default provider)
i18n-micro translate --service ai --token "$AI_GATEWAY_API_KEY" --options model:anthropic/claude-sonnet-4.5

# AI SDK (direct provider — install @ai-sdk/openai in your project)
i18n-micro translate --service ai --token "$OPENAI_API_KEY" --options provider:openai,model:gpt-4o-mini,maxTokens:1000

# Custom provider package
i18n-micro translate --service ai --token "$API_KEY" --options providerPackage:@ai-sdk/google,providerFactory:createGoogleGenerativeAI,model:gemini-2.0-flash

# Yandex Cloud (requires folderId)
i18n-micro translate --service yandexcloud --token "$YANDEX_IAM_TOKEN" --options folderId:YOUR_FOLDER_ID

# Tencent (recommended format)
i18n-micro translate --service tencent --token "$TENCENT_SECRET_KEY" --options secretId:YOUR_SECRET_ID,region:ap-guangzhou
```

For example:

```bash
i18n-micro translate --service ai --token YOUR_OPENAI_API_KEY --options provider:openai,model:gpt-3.5-turbo,maxTokens:1000
```

## 📝 Best Practices

### 🔑 Consistent Key Naming

Ensure translation keys are consistent and descriptive to avoid confusion and duplication.

### 🧹 Regular Maintenance

Use the `clean` command regularly to remove unused translation keys and keep your translation files clean.

### 🛠 Automate Translation Workflow

Integrate `nuxt-i18n-micro-cli` commands into your development workflow or CI/CD pipeline to automate extraction, translation, validation, and synchronization of translation files.

### 🛡️ Secure API Keys

When using translation services that require API keys, ensure your keys are kept secure and not committed to version control systems. Consider using environment variables or secure key management solutions.

## 🧪 Development, Build & Release

The project is built with `vite` and TypeScript declarations are generated with `tsc`.

### Local development checks

```bash
pnpm lint
pnpm test:types
pnpm build
pnpm test:dist
pnpm vitest run
```

### Interactive CLI behavior

- `translate` asks for `--service` and `--token` interactively when flags are omitted.
- `init` asks for project name interactively.
- For CI/non-interactive usage, pass these flags explicitly to avoid prompts.

### CLI output modes

- Default mode is pretty output for humans (sections, status marks, compact tables/lists).
- Use `--json` when output is consumed by scripts/CI parsers (supported in `info`, `diff`, `stats`, `lint`, `optimize`, `search`, `estimate`, `glossary`).
- Prefer pretty mode during local diagnostics, and `--json` for machine-to-machine automation.

### URL building conventions (core services/drivers)

- Use `ufo` for HTTP URLs only (`withoutTrailingSlash` -> `joinURL` -> `withQuery` -> `encodeParam`).
- Keep `pathe` for filesystem paths.
- Prefer explicit URL helpers over manual string concatenation for endpoints/query parts.

### Filesystem conventions (core utils)

- Use `fast-glob` for project file matching (`glob` is removed).
- Use `fs-extra` in shared FS helpers for write/copy/remove operations to reduce manual directory boilerplate.
- Keep `pathe` as the standard for cross-platform filesystem path composition.

### Build output

- Runtime bundle: `dist/index.mjs` (generated by `vite build`)
- Type declarations: `dist/**/*.d.ts` (generated by `tsc -p tsconfig.build.json`)
- CLI entrypoint: `bin/i18n.mjs` (loads `dist/index.mjs`)

### Release flow

Before publishing, run:

```bash
pnpm test
```

`pnpm test` already includes linting, type-checking, build, dist smoke-test, and unit tests.

## 📞 Support and Contributions

If you encounter issues or have suggestions for improvements, feel free to contribute to the project or open an issue on the project's repository.

## License

[MIT](./LICENSE)
