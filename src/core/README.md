# Core Architecture

`core` is the business-logic layer. Commands should only orchestrate input/output and delegate work to services here.

## Main Building Blocks

- `Project.ts`:
  - `I18nProject` aggregate root;
  - loads locales once;
  - provides locale access and centralized save.
- `TranslationSet.ts`:
  - in-memory translation model (`global` + `pages`);
  - flat/nested key operations;
  - tracks modifications (`isModified`).
- `ports/IStorage.ts`:
  - storage interface used by core;
  - implemented by adapters.
- `types.ts`:
  - shared types for core and adapters.

## Services

- `DiffService.ts`: missing-key diff across locales.
- `TranslationService.ts`: automatic translation, batching/chunking.
- `SyncService.ts`: local locale synchronization by reference locale.
- `ValidationService.ts`: missing/extra key validation.
- `StatsService.ts`: prepares normalized stats input from project.
- `StatsReportService.ts`: builds stats report + HTML output.
- `RemoteSyncService.ts`: pull/push + conflict resolution for remote storage.
- `OptimizeService.ts`: translation file analysis and optimization workflows.
- `InfoService.ts`: project/system/CLI info snapshot building.
- `LintService.ts`: rules, checks, and optional auto-fix flow.
- `FormatService.ts`: sort/normalize translation structures.
- `CsvService.ts`: CSV export/import over project data.
- `ReplaceValuesService.ts`: bulk value replacement across scopes.
- `ExtractService.ts`: applies extracted keys into project maps.
- `SplitService.ts`: split translation maps into multiple files.

## Layering Rule

- `commands` -> `core/services` -> `core` model/ports -> `adapters`.
- `core` must not import command code.
- direct `fs/path` usage belongs in adapters or dedicated infra-oriented services only.
