# terminal-theme-playground

A static browser playground for designing palette-only TUI themes: see how
**Claude Code**, **opencode**, and **pi** render under any 16-color terminal
ANSI palette, edit token-to-slot assignments with live feedback, and copy the
theme back in each tool's exact native JSON dialect.

Live: https://seigiard.com/terminal-theme-playground/

## Why

TUI themes under a palette-only contract reference terminal ANSI slots, never
baked hex — so every tool follows the terminal scheme automatically. But
nothing shows what a theme *looks like* under a given palette; picking a slot
for a token is blind guessing. On the Alabaster palette, slots 7 and 15 equal
the background — text assigned there silently disappears, which is exactly how
a pi theme once drifted into baked hex. This playground is the eyes; syntactic
contract tests in the theme's home repo stay the enforcement.

## Using it

- **Palette panel** — edit 16 slots plus default fg/bg, or load a preset
  (Alabaster, Flexoki Light). Slots that equal the background or another slot
  are flagged; every change re-renders all three previews live.
- **Per-tool tabs** — each tab edits that tool's native theme JSON token by
  token via slot selects. pi edits move the shared var (the co-move set is
  listed; "detach" forks a token to a literal). Claude Code distinguishes
  base-inherited values from overrides; clearing an override reverts to base.
  opencode edits emit plain single values; replacing a `{dark, light}` variant
  warns that both modes collapse.
- **Raw JSON** — a bidirectional view per tab; invalid or schema-breaking
  pastes are rejected whole, prior state stays intact. Values legal in a
  dialect but outside the slot set (`ansi256(n)`, `rgb()`, cube indices,
  variants) load as read-only chips and are never rewritten by loading alone.
- **Previews** — mock TUI layouts skinned from a re-implemented resolver per
  dialect. Clicking any surface jumps to the token(s) that color it.
- **Export** — copies the theme JSON to the clipboard in the native dialect;
  contract violations warn first; on clipboard failure a selectable text
  fallback appears. State persists in `localStorage`; "Reset to seeds"
  (with confirmation) returns everything to the vendored data.

## The palette-only contract

The checker mirrors the bats assertions in the theme's home repo:

- **pi** — every `vars` value is an integer 0–15; no `colors` value starts
  with `#`; `colors.text` and `colors.userMessageBg` stay `""` (terminal
  default).
- **Claude Code** — `base` is an ANSI base (`light-ansi` / `dark-ansi`);
  every override starts with `ansi:`.
- **opencode** — theme values are slots 0–15, token/defs references, or
  `none`/`transparent`; hex and cube indices are flagged.

Violations flag the token row, the tab header, and the export.

## Fidelity caveats (read before trusting a preview)

- **opencode bare ints**: the real tool resolves bare integers through a
  hardcoded standard-16 table (`ansiToRgba` in `packages/tui/src/theme`), not
  the live terminal palette — only its built-in `system` theme queries the
  terminal. The playground maps 0–15 through the live palette, because
  previewing under a palette is the point. An exported bare-int theme will
  render with standard xterm colors in real opencode, not your terminal's
  palette.
- **opencode seed grays**: the real `system` theme computes muted text,
  borders, panel backgrounds, and diff backgrounds from background luminance
  (gray ramps and alpha tints). Those are not expressible as palette slots;
  the vendored seed approximates them (slot 8 for grays, slot 15 for panels,
  `transparent` for diff tints). See `data/tokens/opencode.js`.
- **Claude Code token list** is reverse-engineered (via claude-theme-builder),
  not documented; it moves with tool versions.
- Mock layouts approximate each tool's chrome; they cover the surfaces where
  color choices bite, not pixel-perfect reproduction.

## Manual fidelity checklist

Run after changing mocks or refreshing vendored data — side by side with the
real tools on the same terminal palette:

1. Claude Code: user message background, tool-call success/error accents,
   diff line/word colors, permission dialog accent, prompt border, mode
   indicators (plan / auto-accept / fast).
2. opencode: panel/element background steps, diff line-number gutter,
   markdown heading/link/code colors, status bar accents.
3. pi: muted/dim hierarchy, tool box backgrounds (pending/success/error),
   markdown code block border, syntax colors, selected-line background.
4. All three: switch Alabaster → Flexoki Light; every preview re-skins
   without reload. Assign a text token to slot 7 on Alabaster; it must
   visibly disappear and its editor row must flag "= bg".

Status: in-browser checks (item 4 and the per-surface render) are verified;
the side-by-side pass against the real tools has not been run yet.

## Development

No build, no dependencies. Plain ES modules and JSON.

```bash
node --test               # unit tests (data shape, resolvers, contract, edits, export)
python3 -m http.server    # serve locally, open http://localhost:8000
```

Deploy: GitHub Pages via `.github/workflows/deploy.yml` on every push to
`main` (tests gate the deploy). The page is fully static and self-contained —
no runtime requests leave the origin.

Vendored data provenance and the refresh procedure: `data/SOURCES.md`.

## License

MIT — see `LICENSE`. Vendored data and ported techniques derive from
MIT-licensed projects credited in `data/SOURCES.md`: claude-theme-builder
(RandolfTjandra), opencode-theme-studio (kkugot), and the opencode source.
