# Prompt Palette v22

Static GitHub Pages app. No build step, external scripts, network API, or image upload.

v22 retains state schema 17. Multi-shot layouts now require touching image frames with no white gaps, background bands or gutters; any negative space belongs inside a photograph. Camera & light adds three modes: the existing planned/individual controls, AI decides (no concrete camera values plus a strict distinct-composition requirement), and Omit (no dedicated distance, angle or lighting instructions). Existing individual choices remain saved while another mode is active.

v21 added a complexion lock immediately after BODY whenever built-in muscle growth, regional development or vascularity is selected. It limits BODY changes to the selected physique axes and fixes complexion brightness, hue, undertone, white balance and color grading to the reference across every photograph.

v20 added four opt-in posture presets describing supine arms-open, low recline with a torso turn, kneeling with a slight forward lean, and a back-facing over-shoulder turn. An independent Overhead camera angle does not select a posture or setting. Automatic pose/angle choices remain unchanged. Pecs is an independent regional muscle-growth choice, combinable with other regions, overall growth and vascularity. It targets pectoralis major muscle, not breast tissue; without a bust or custom body adjustment, breast-tissue volume is retained. Bust growth can still be selected separately.

v19 retained state schema 17. The former Partner POV preset is now labeled Gaze & expression and describes visible gaze, eye/mouth changes and expression timing without specifying a personal relationship or an intended emotional response. The four take patterns and the `partner-pov` ID remain unchanged; no custom text is rewritten. These are prompt-level changes, not a guarantee of identical generated images.

v18 preserved the reference time of day when no setting is selected and disabled “New take” when every photographic axis is locked.

## Active structure

- `catalog.js`: bilingual presets, stable legacy IDs and single-axis metadata.
- `engine.js`: pure state migration, normalization, conflict resolution and per-photo planning.
- `app.js`: compact UI, storage, editor, import/export and clipboard.
- `index.html` / `style.css`: accessible mobile-first UI. Active assets use `?v=22`.

Older `data`, `overrides`, `extras`, `pre-*` and `post-*` files remain as historical source but are **not loaded**. Do not add new patches to the inactive chain.

## Responsibilities and precedence

Identity, fair reference skin and photographic quality are fixed common constraints. Former MASTER choices now set a photographic tone, not a safety level. Variation determines only unspecified photographic axes. Explicit posture, expression, distance, angle, setting and light override only their own axes; reference locks remain effective even with dynamic variation.

The compiler emits concrete instructions, not category-routing paragraphs. Each photo gets one setting and one posture; extra choices rotate through “New take”. Gaze & expression controls only gaze and facial expression, without forcing posture, clothing or camera changes. Sunset is lighting; a night scene takes priority over evening daylight. Single-photo layouts favor a prominent vertical portrait unless framing is locked. All layouts are flat pre-publication digital canvases, not photographed books.

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
