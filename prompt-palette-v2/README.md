# Prompt Palette v18

Static GitHub Pages app. No build step, external scripts, network API, or image upload.

v18 retains state schema 17. It preserves the reference time of day when no setting is selected, and disables “New take” when every photographic axis is locked.

## Active structure

- `catalog.js`: bilingual presets, stable legacy IDs and single-axis metadata.
- `engine.js`: pure state migration, normalization, conflict resolution and per-photo planning.
- `app.js`: compact UI, storage, editor, import/export and clipboard.
- `index.html` / `style.css`: accessible mobile-first UI. Active assets use `?v=18`.

Older `data`, `overrides`, `extras`, `pre-*` and `post-*` files remain as historical source but are **not loaded**. Do not add new patches to the inactive chain.

## Responsibilities and precedence

Identity, fair reference skin and photographic quality are fixed common constraints. Former MASTER choices now set a photographic tone, not a safety level. Variation determines only unspecified photographic axes. Explicit posture, expression, distance, angle, setting and light override only their own axes; reference locks remain effective even with dynamic variation.

The compiler emits concrete instructions, not category-routing paragraphs. Each photo gets one setting and one posture; extra choices rotate through “New take”. Partner POV controls gaze and expression without forcing clothing or camera changes. Sunset is lighting; a night scene takes priority over evening daylight. Single-photo layouts favor a prominent vertical portrait unless framing is locked. All layouts are flat pre-publication digital canvases, not photographed books.

Global and regional hypertrophy combine as extra regional emphasis. Direct and extreme are distinct strengths. Vascularity is independent from mass. Clothing is optional and retained from the reference when unset; more coverage takes priority over styling. Arbitrary custom text is not semantically parsed: a visible warning asks the user to review conflicts. Missing or Japanese-containing custom EN text is omitted from EN output with a warning; no Japanese fallback. JP retains the legacy JP-then-EN fallback.

## Data and migration

`promptPaletteV2` now contains schema version 17 with selections and custom rows. On first successful migration, the exact previous value is retained in `promptPaletteV2BackupBeforeV17` before the current key is written. V1 is read only if V2 is absent. Custom IDs, both text fields and additional metadata survive. Invalid, future-version, quota-blocked or concurrently modified data is protected from overwrite. Export is available even when writes are blocked.

Legacy partner/candid choices move to expression; sunset moves to light; `hotel` maps to `soft-interior`. Redundant muscle strengths resolve to direct/extreme. The exact old combination remains in the backup. Collapse preferences retain old keys and map corresponding sections to the new groups. Import first stores the current raw value in `promptPaletteV2BackupBeforeImport`. Both backup types can be exported from settings. Reset removes selections only, not custom rows. Built-ins are edited by duplication, leaving their structured behavior intact.

## Checks

```sh
node --test prompt-palette-v2/tests/*.test.cjs
```

Tests cover bilingual catalog completeness, migration, custom metadata, storage failures, future schemas, concurrent-tab protection, heading stripping, body combinations, exact photo counts, axis locks, night-light precedence, custom editing and optional selection behavior. Storage tests use a minimal DOM fixture, not a browser rendering engine.

`tests/mobile.html` is a narrow-viewport CSS check, sharing the normal app's local storage. It is not an iOS Safari emulator. Verify native clipboard, keyboard and safe-area behavior on an actual iPhone before claiming device-specific compatibility.

## Release

Read current GitHub file SHAs first, increment active asset versions, publish one atomic commit based on the latest root tree, then re-fetch changed files and inspect the Pages deployment. Leave other repository apps untouched. The pre-v17 app can be recovered from commit `3f34774ddd654cb7bae596a32384002075ca64e2`; recover user state from its exported original backup when rolling back. Do not feed schema 17 directly to the legacy app.
