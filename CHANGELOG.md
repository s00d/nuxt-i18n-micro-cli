# Changelog

## v2.1.1

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v2.1.0...v2.1.1)

### 🩹 Fixes

- **dependencies:** Pin `@lokalise/node-api` to v15, `@yandex-cloud/nodejs-sdk` to `>=2.8.0 <2.9.0`, and `p-retry` to v7 so installs on Node 20 no longer trigger `EBADENGINE` warnings.

## v2.1.0

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v2.0.1...v2.1.0)

### 💥 Breaking Changes

- **translate / AI:** Remove dedicated `--service` values `openai`, `anthropic`, `mistral`, `cohere`, and `groq`. Use `--service ai` with Vercel AI SDK options (`provider`, `model`, `providerPackage`, `providerFactory`) instead.
- **dependencies:** Upgrade `archiver` to v8 (`ZipArchive` API) for remote TMS zip handling.

### 🚀 Enhancements

- **translate / AI:** Add unified `ai` translator on top of Vercel AI SDK (`ai` + `zod`) with structured output, dynamic loading of any `@ai-sdk/*` provider package, and AI Gateway support via `provider:gateway`.
- **translate / HTTP drivers:** Replace legacy SDK wrappers with direct REST clients (`axios`) for Google Cloud Translate, Tencent TMT (TC3 signing), Papago, Baidu, Lilt, and Reverso — same CLI options, smaller install footprint, no deprecated production transitive dependencies.
- **text-to-i18n:** Scan Nuxt 4 `app/` source roots (`app/pages`, `app/components`, etc.) and generate keys relative to `app/*` paths.
- **dependencies:** Refresh core toolchain and provider packages (Nuxt 4.4.5, Vitest 4.1.6, `oxc-parser`, Crowdin/Lokalise SDKs, DeepL, and others).

### 🩹 Fixes

- **yandexcloud:** Keep `@yandex-cloud/nodejs-sdk` on v2 API compatible with current `moduleResolution`.
- **build:** Externalize `ai`, `zod`, and `@ai-sdk/*` in Vite bundle; add runtime `mlly` dependency for dynamic provider imports.

### 🏗️ Internal / Tooling

- **dependencies:** Remove `@google-cloud/translate`, `tencentcloud-sdk-nodejs-tmt`, `papago`, `baidu-translate-service`, `lilt-node`, `reverso-api`, and vendor LLM SDKs (`openai`, `@anthropic-ai/sdk`, `@mistralai/mistralai`, `cohere-ai`, `groq-sdk`, `@babel/runtime`).
- **tests:** Add coverage for AI config, HTTP translator drivers, Tencent TC3 signing, Nuxt 4 `app/` key generation, and expanded `source-files` scanning.

## v2.0.0

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.3.0...v2.0.0)

### 💥 Breaking Changes

- **architecture:** Migrate command/business logic to a Domain-Oriented Core (`src/core/**`) with thin CLI commands delegating to services.
- **build:** Replace `unbuild` flow with `vite` + `tsc` build pipeline and update runtime output expectations.
- **paths/imports:** Move and consolidate legacy `src/utils/**` modules into new core-oriented namespaces.

### 🚀 Enhancements

- **new commands:** Add `search`, `rename`, `pseudo`, `estimate`, and `glossary` commands.
- **search:** Implement deep cross-layer search (key/value/usages/hardcoded), relevance ranking, `--onlyUnused`, `--preferUnused`, `--scope`, `--limit`, `--hardcodedOnly`, and `--onlyVue`.
- **sync-remote:** Rework remote sync with a unified provider protocol and registry/factory architecture.
- **remote providers:** Upgrade GitHub/GitLab integrations to official SDKs (`octokit`, `@gitbeaker/rest`).
- **tms providers:** Implement native Crowdin/Lokalise import/export flows with polling, zip handling, and language mapping.
- **layers support:** Add robust Nuxt Layers support for project config discovery, storage merging, watcher behavior, and command execution.
- **stats:** Improve layered key accounting and add git baseline comparison support (`--baseRef`).
- **text processing:** Expand AST-based extraction/rewrite workflows for `extract` and `text-to-i18n`.
- **translation pipeline:** Add placeholder/plural handling improvements and richer translator option support.
- **playground:** Add multi-layer playground structure (including upper `playground_base` layer), more pages, and richer fixtures for stress testing.
- **cli ux:** Improve console rendering via shared render helpers, cleaner sections, and machine-readable `--json` support across core diagnostics commands.

### 🩹 Fixes

- **search:** Fix locale coverage collection so matches retain full locale value context.
- **search:** Fix mixed-line hardcoded detection (plain text next to `$t(...)`).
- **project loading:** Fix layered source selection when `translationDir` is explicitly provided but equals configured default.
- **typing:** Resolve strict TypeScript issues around Nuxt `_layers` access and SDK response typing.

### 🏗️ Internal / Tooling

- **dependencies:** Standardize and modernize dependency set (`ufo`, `defu`, `p-limit`, `p-retry`, `p-timeout`, `pretty-bytes`, `pretty-ms`, `flat`, `dset`, `dlv`, `@inquirer/prompts`, and provider SDKs).
- **tests:** Add/expand tests for layered config/storage/project behavior, search command/service, translator policies/drivers, and command outputs.
- **docs:** Refresh README command reference and remote sync configuration documentation (GitHub/GitLab/Crowdin/Lokalise examples).

## v1.3.0

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- **format:** Improve command structure and enhance translation file formatting ([9579af6](https://github.com/s00d/nuxt-i18n-micro-cli/commit/9579af6))
- **lint:** Add translation quality check command ([f8bd8f5](https://github.com/s00d/nuxt-i18n-micro-cli/commit/f8bd8f5))
- **info:** Add command to display CLI and project information ([d159693](https://github.com/s00d/nuxt-i18n-micro-cli/commit/d159693))
- **commands:** Add 'info' and 'lint' commands to command list ([a907f65](https://github.com/s00d/nuxt-i18n-micro-cli/commit/a907f65))
- **commands:** Add init command to initialize a new Nuxt 3 project ([89276c9](https://github.com/s00d/nuxt-i18n-micro-cli/commit/89276c9))

### 🩹 Fixes

- **main:** Update import statement for package.json to use 'with' ([68f4256](https://github.com/s00d/nuxt-i18n-micro-cli/commit/68f4256))

### 💅 Refactors

- **commands:** Remove backup option from clean command ([7c307fc](https://github.com/s00d/nuxt-i18n-micro-cli/commit/7c307fc))
- **split:** Remove backup option and related logic from split command ([368549d](https://github.com/s00d/nuxt-i18n-micro-cli/commit/368549d))
- **sync-remote:** Remove backup functionality from sync command ([71bc1f4](https://github.com/s00d/nuxt-i18n-micro-cli/commit/71bc1f4))
- **tests:** Remove backup option from command tests ([a63cb5e](https://github.com/s00d/nuxt-i18n-micro-cli/commit/a63cb5e))

### ❤️ Contributors

- Pavel Kuzmin ([@s00d](http://github.com/s00d))

## v1.2.0

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.1.1...v1.2.0)

### 🚀 Enhancements

- **clean:** Add include, exclude, and backup options to clean command ([bb7c5f3](https://github.com/s00d/nuxt-i18n-micro-cli/commit/bb7c5f3))
- **extract:** Enhance translation merging for locale objects ([7a097ad](https://github.com/s00d/nuxt-i18n-micro-cli/commit/7a097ad))
- **sync-remote:** Add command for synchronizing translations with remote storage ([c88285a](https://github.com/s00d/nuxt-i18n-micro-cli/commit/c88285a))
- **sync:** Check for existence of translation files before syncing ([902ecd1](https://github.com/s00d/nuxt-i18n-micro-cli/commit/902ecd1))
- **stats:** Check for existence of translation files before analysis ([bd8162c](https://github.com/s00d/nuxt-i18n-micro-cli/commit/bd8162c))
- **split:** Add command to split large translation files ([6c5baac](https://github.com/s00d/nuxt-i18n-micro-cli/commit/6c5baac))
- **commands:** Add backup and restore commands for translation files ([a901d5f](https://github.com/s00d/nuxt-i18n-micro-cli/commit/a901d5f))
- **optimize:** Add command to optimize translation files structure ([3ee1d69](https://github.com/s00d/nuxt-i18n-micro-cli/commit/3ee1d69))
- **commands:** Add format command for translation file formatting ([1bd254c](https://github.com/s00d/nuxt-i18n-micro-cli/commit/1bd254c))
- **commands:** Add new commands for format, split, backup, and restore ([1b9f283](https://github.com/s00d/nuxt-i18n-micro-cli/commit/1b9f283))
- **backup:** Add backup and restore functionality ([c5fa369](https://github.com/s00d/nuxt-i18n-micro-cli/commit/c5fa369))
- **split:** Add split command for managing translation files ([2478c4e](https://github.com/s00d/nuxt-i18n-micro-cli/commit/2478c4e))

### 🩹 Fixes

- **export-csv:** Handle errors while loading translation files ([2075a94](https://github.com/s00d/nuxt-i18n-micro-cli/commit/2075a94))

### 🏡 Chore

- **build:** Add `archiver` and `extract-zip` dependencies ([71fa627](https://github.com/s00d/nuxt-i18n-micro-cli/commit/71fa627))

### ✅ Tests

- **commands:** Add unit tests ([04d76eb](https://github.com/s00d/nuxt-i18n-micro-cli/commit/04d76eb))

### ❤️ Contributors

- Pavel Kuzmin ([@s00d](http://github.com/s00d))

## v1.1.1

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.1.0...v1.1.1)

### 📖 Documentation

- **readme:** Update documentation with new command and link to guide ([b84b709](https://github.com/s00d/nuxt-i18n-micro-cli/commit/b84b709))

### ❤️ Contributors

- Pavel Kuzmin ([@s00d](http://github.com/s00d))

## v1.1.0

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.13...v1.1.0)

### 🚀 Enhancements

- **components:** Add custom component for displaying messages ([4cce67c](https://github.com/s00d/nuxt-i18n-micro-cli/commit/4cce67c))
- **test-page:** Add CustomComponent to enhance user interface ([c3f4d74](https://github.com/s00d/nuxt-i18n-micro-cli/commit/c3f4d74))
- **test-page:** Add CustomComponent to enhance user interface ([28e3652](https://github.com/s00d/nuxt-i18n-micro-cli/commit/28e3652))

### ❤️ Contributors

- Pavel Kuzmin ([@s00d](http://github.com/s00d))

## v1.0.13

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.12...v1.0.13)

## v1.0.12

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.11...v1.0.12)

## v1.0.11

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.10...v1.0.11)

## v1.0.10

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.9...v1.0.10)

## v1.0.9

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.8...v1.0.9)

## v1.0.8

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.7...v1.0.8)

## v1.0.7

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.6...v1.0.7)

## v1.0.6

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.5...v1.0.6)

## v1.0.5

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.4...v1.0.5)

## v1.0.4

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.3...v1.0.4)

## v1.0.3

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.2...v1.0.3)

## v1.0.2

[compare changes](https://github.com/s00d/nuxt-i18n-micro-cli/compare/v1.0.1...v1.0.2)

## v1.0.1

