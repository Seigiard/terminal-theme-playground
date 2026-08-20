# Vendored data provenance

Seed data is vendored **one time** with the sources below. It is not synced;
drift is accepted and refresh is manual. To refresh, re-read each source and
re-run `node --test tests/` (data-shape tests catch structural drift).

Seed files under `data/seeds/` are kept **verbatim** (no metadata keys added)
so that exporting an untouched seed byte-matches the vendored file. Their
provenance therefore lives here instead of inside the JSON.

| File | Source | Version / commit | Vendored |
|---|---|---|---|
| `data/palettes/alabaster.json` | `home/private_dot_config/kitty/Alabaster.conf` in my-mac-setup (upstream: kitty-alabaster, MIT, Nikita Prokopov) | `my-mac-setup@39ea84c` | 2026-08-20 |
| `data/palettes/flexoki-light.json` | `home/private_dot_config/kitty/flexoki-light.conf` in my-mac-setup (upstream: Flexoki by Steph Ango, via Ghostty's bundled theme) | `my-mac-setup@39ea84c` | 2026-08-20 |
| `data/seeds/pi.json` | `home/dot_pi/agent/themes/terminal.json` in my-mac-setup (verbatim) | `my-mac-setup@39ea84c`, pi schema `v0.84.2` | 2026-08-20 |
| `data/seeds/claude.json` | `home/private_dot_claude/themes/light-ansi-daltonized.json` in my-mac-setup (verbatim) | `my-mac-setup@39ea84c` | 2026-08-20 |
| `data/seeds/opencode.json` | Derived from opencode's built-in `system` theme generation (see `data/tokens/opencode.js` header for the source permalink) | see file header | 2026-08-20 |
| `data/tokens/claude.js` | `CTB.RAW_BASES`, `CTB.SCHEMA`, `CTB.ANSI_HEX` from claude-theme-builder `index.html` (MIT, RandolfTjandra; token set reverse-engineered from the Claude Code binary) | fetched 2026-08-20 | 2026-08-20 |
| `data/tokens/pi.js` | Token/purpose table from https://pi.dev/docs/latest/themes | pi schema `v0.84.2`, fetched 2026-08-20 | 2026-08-20 |
| `data/tokens/opencode.js` | opencode source `packages/tui/src/theme` (system theme generation + theme JSON schema) | see file header | 2026-08-20 |

Ported logic (not data):

- opencode resolver semantics ported from opencode-theme-studio
  `src/domain/opencode/resolveTheme.ts` (MIT, kkugot).
- Preview `data-uses` / CSS-custom-property technique from claude-theme-builder
  (MIT, RandolfTjandra).
