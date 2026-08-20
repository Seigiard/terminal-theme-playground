// pi theme token data.
//
// Source: token/purpose tables from https://pi.dev/docs/latest/themes
// (pi schema v0.84.2, fetched 2026-08-20). Seed: data/seeds/pi.json
// (my-mac-setup@39ea84c, verbatim).
//
// Value formats a pi theme accepts per token: 6-digit hex ("#ff0000"),
// xterm 256-color index (0-255), a reference to a `vars` entry ("primary"),
// or "" for the terminal's default color.

// Token schema: group -> [{ key, hint, fallback? }]. `fallback` names the
// token pi falls back to when this one is absent (per the official docs).
export const SCHEMA = [
  { group: 'General', keys: [
    { key: 'accent', hint: 'Primary accent (logo, selected items, cursor)' },
    { key: 'border', hint: 'Normal borders' },
    { key: 'borderAccent', hint: 'Highlighted borders' },
    { key: 'borderMuted', hint: 'Subtle borders (editor)' },
    { key: 'success', hint: 'Success states' },
    { key: 'error', hint: 'Error states' },
    { key: 'warning', hint: 'Warning states' },
    { key: 'muted', hint: 'Secondary text' },
    { key: 'dim', hint: 'Tertiary text' },
    { key: 'text', hint: 'Default text (usually "")' },
    { key: 'thinkingText', hint: 'Thinking block text' },
  ] },
  { group: 'Transcript', keys: [
    { key: 'selectedBg', hint: 'Selected line background' },
    { key: 'scrollbarThumb', hint: 'Fullscreen scrollbar thumb background', fallback: 'selectedBg' },
    { key: 'searchMatchBg', hint: 'Search match background / current-match text', fallback: 'selectedBg' },
    { key: 'searchMatchText', hint: 'Search match text / current-match background', fallback: 'text' },
    { key: 'userMessageBg', hint: 'User message background' },
    { key: 'userMessageText', hint: 'User message text' },
    { key: 'customMessageBg', hint: 'Extension message background' },
    { key: 'customMessageText', hint: 'Extension message text' },
    { key: 'customMessageLabel', hint: 'Extension message label' },
    { key: 'toolPendingBg', hint: 'Tool box (pending)' },
    { key: 'toolSuccessBg', hint: 'Tool box (success)' },
    { key: 'toolErrorBg', hint: 'Tool box (error)' },
    { key: 'toolTitle', hint: 'Tool title' },
    { key: 'toolOutput', hint: 'Tool output text' },
  ] },
  { group: 'Markdown', keys: [
    { key: 'mdHeading', hint: 'Headings' },
    { key: 'mdLink', hint: 'Link text' },
    { key: 'mdLinkUrl', hint: 'Link URL' },
    { key: 'mdCode', hint: 'Inline code' },
    { key: 'mdCodeBlock', hint: 'Code block content' },
    { key: 'mdCodeBlockBorder', hint: 'Code block fences' },
    { key: 'mdQuote', hint: 'Blockquote text' },
    { key: 'mdQuoteBorder', hint: 'Blockquote border' },
    { key: 'mdHr', hint: 'Horizontal rule' },
    { key: 'mdListBullet', hint: 'List bullets' },
  ] },
  { group: 'Diff', keys: [
    { key: 'toolDiffAdded', hint: 'Added lines' },
    { key: 'toolDiffRemoved', hint: 'Removed lines' },
    { key: 'toolDiffContext', hint: 'Context lines' },
  ] },
  { group: 'Syntax', keys: [
    { key: 'syntaxComment', hint: 'Comments' },
    { key: 'syntaxKeyword', hint: 'Keywords' },
    { key: 'syntaxFunction', hint: 'Function names' },
    { key: 'syntaxVariable', hint: 'Variables' },
    { key: 'syntaxString', hint: 'Strings' },
    { key: 'syntaxNumber', hint: 'Numbers' },
    { key: 'syntaxType', hint: 'Types' },
    { key: 'syntaxOperator', hint: 'Operators' },
    { key: 'syntaxPunctuation', hint: 'Punctuation' },
  ] },
  { group: 'Thinking levels', keys: [
    { key: 'thinkingOff', hint: 'Thinking off' },
    { key: 'thinkingMinimal', hint: 'Minimal thinking' },
    { key: 'thinkingLow', hint: 'Low thinking' },
    { key: 'thinkingMedium', hint: 'Medium thinking' },
    { key: 'thinkingHigh', hint: 'High thinking' },
    { key: 'thinkingXhigh', hint: 'Extra high thinking' },
    { key: 'thinkingMax', hint: 'Maximum thinking', fallback: 'thinkingXhigh' },
  ] },
  { group: 'Bash mode', keys: [
    { key: 'bashMode', hint: 'Editor border in bash mode (! prefix)' },
  ] },
];

export const ALL_KEYS = SCHEMA.flatMap((g) => g.keys.map((k) => k.key));

export const HINTS = Object.fromEntries(
  SCHEMA.flatMap((g) => g.keys.map((k) => [k.key, k.hint])),
);
