// opencode theme token data.
//
// Source: sst/opencode @ ad192a59b5517fb432bc5f4d27f131d605a22beb (dev branch,
// fetched 2026-08-20), packages/tui/src/theme/index.ts — the `Theme` type
// (47 color tokens) and `generateSystem`, which builds the built-in `system`
// theme from the terminal's live 16-color palette.
//
// Seed derivation (data/seeds/opencode.json), per token below in `system`:
// - a number N: generateSystem reads ANSI slot N — the seed uses that slot.
// - 'fg' / 'bg': generateSystem uses the terminal default fg/bg; its own
//   fallback slots are 7 (fg) and 0 (bg), which the seed uses. `background`
//   is bg with alpha 0 in the real generator, so the seed uses "transparent".
// - 'derived': generateSystem COMPUTES the value from bg luminance (gray
//   ramp, muted-text formula, or alpha tint) — not expressible as a palette
//   slot. The seed approximates: muted/border grays -> slot 8, panel
//   backgrounds -> slot 15, alpha-tinted diff backgrounds -> "transparent".
//   This is the seed's documented fidelity loss vs the real system theme.
//
// Theme JSON shape: { $schema?, defs?, theme } where defs values are hex or
// ref strings (never numbers) and theme values are hex | ref | bare int
// 0-255 | "none"/"transparent" | {dark, light}. `selectedListItemText`
// (falls back to background), `backgroundMenu` (falls back to
// backgroundElement) and `thinkingOpacity` (defaults to 0.6) are optional.

export const SCHEMA = [
  { group: 'Accent & status', keys: [
    { key: 'primary', hint: 'Primary accent', system: 6 },
    { key: 'secondary', hint: 'Secondary accent', system: 5 },
    { key: 'accent', hint: 'Accent highlights', system: 6 },
    { key: 'error', hint: 'Error states', system: 1 },
    { key: 'warning', hint: 'Warning states', system: 3 },
    { key: 'success', hint: 'Success states', system: 2 },
    { key: 'info', hint: 'Info states', system: 6 },
  ] },
  { group: 'Text', keys: [
    { key: 'text', hint: 'Default text', system: 'fg' },
    { key: 'textMuted', hint: 'Secondary/muted text', system: 'derived' },
    { key: 'selectedListItemText', hint: 'Selected list item text (optional, falls back to background)', system: 'bg', optional: true },
  ] },
  { group: 'Backgrounds', keys: [
    { key: 'background', hint: 'Main background (system keeps terminal transparency)', system: 'bg' },
    { key: 'backgroundPanel', hint: 'Panel background', system: 'derived' },
    { key: 'backgroundElement', hint: 'Element background', system: 'derived' },
    { key: 'backgroundMenu', hint: 'Menu background (optional, falls back to backgroundElement)', system: 'derived', optional: true },
  ] },
  { group: 'Borders', keys: [
    { key: 'border', hint: 'Normal borders', system: 'derived' },
    { key: 'borderActive', hint: 'Active borders', system: 'derived' },
    { key: 'borderSubtle', hint: 'Subtle borders', system: 'derived' },
  ] },
  { group: 'Diff', keys: [
    { key: 'diffAdded', hint: 'Added line text', system: 2 },
    { key: 'diffRemoved', hint: 'Removed line text', system: 1 },
    { key: 'diffContext', hint: 'Context line text', system: 'derived' },
    { key: 'diffHunkHeader', hint: 'Hunk header', system: 'derived' },
    { key: 'diffHighlightAdded', hint: 'Added word highlight', system: 10 },
    { key: 'diffHighlightRemoved', hint: 'Removed word highlight', system: 9 },
    { key: 'diffAddedBg', hint: 'Added line background (system: green tint over bg)', system: 'derived' },
    { key: 'diffRemovedBg', hint: 'Removed line background (system: red tint over bg)', system: 'derived' },
    { key: 'diffContextBg', hint: 'Context line background', system: 'derived' },
    { key: 'diffLineNumber', hint: 'Line numbers', system: 'derived' },
    { key: 'diffAddedLineNumberBg', hint: 'Added line-number background', system: 'derived' },
    { key: 'diffRemovedLineNumberBg', hint: 'Removed line-number background', system: 'derived' },
  ] },
  { group: 'Markdown', keys: [
    { key: 'markdownText', hint: 'Body text', system: 'fg' },
    { key: 'markdownHeading', hint: 'Headings', system: 'fg' },
    { key: 'markdownLink', hint: 'Link URL', system: 4 },
    { key: 'markdownLinkText', hint: 'Link text', system: 6 },
    { key: 'markdownCode', hint: 'Inline code', system: 2 },
    { key: 'markdownBlockQuote', hint: 'Blockquotes', system: 3 },
    { key: 'markdownEmph', hint: 'Emphasis', system: 3 },
    { key: 'markdownStrong', hint: 'Strong text', system: 'fg' },
    { key: 'markdownHorizontalRule', hint: 'Horizontal rule', system: 'derived' },
    { key: 'markdownListItem', hint: 'List bullets', system: 4 },
    { key: 'markdownListEnumeration', hint: 'List numbers', system: 6 },
    { key: 'markdownImage', hint: 'Image marker', system: 4 },
    { key: 'markdownImageText', hint: 'Image alt text', system: 6 },
    { key: 'markdownCodeBlock', hint: 'Code block text', system: 'fg' },
  ] },
  { group: 'Syntax', keys: [
    { key: 'syntaxComment', hint: 'Comments', system: 'derived' },
    { key: 'syntaxKeyword', hint: 'Keywords', system: 5 },
    { key: 'syntaxFunction', hint: 'Function names', system: 4 },
    { key: 'syntaxVariable', hint: 'Variables', system: 'fg' },
    { key: 'syntaxString', hint: 'Strings', system: 2 },
    { key: 'syntaxNumber', hint: 'Numbers', system: 3 },
    { key: 'syntaxType', hint: 'Types', system: 6 },
    { key: 'syntaxOperator', hint: 'Operators', system: 6 },
    { key: 'syntaxPunctuation', hint: 'Punctuation', system: 'fg' },
  ] },
];

export const ALL_KEYS = SCHEMA.flatMap((g) => g.keys.map((k) => k.key));
