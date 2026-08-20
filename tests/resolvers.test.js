import { test } from 'node:test';
import assert from 'node:assert/strict';

import { xterm256ToHex } from '../js/resolvers/xterm.js';
import { resolvePi } from '../js/resolvers/pi.js';
import { resolveClaude } from '../js/resolvers/claude.js';
import { resolveOpencode } from '../js/resolvers/opencode.js';
import { ALL_KEYS as CLAUDE_KEYS } from '../data/tokens/claude.js';
import { ALL_KEYS as OPENCODE_KEYS } from '../data/tokens/opencode.js';
import { alabaster as palette, piSeed, claudeSeed, opencodeSeed } from './helpers.js';

// #region xterm 256-color helpers

test('xterm256ToHex: 16-231 is the 6x6x6 color cube', () => {
  assert.equal(xterm256ToHex(16), '#000000');
  assert.equal(xterm256ToHex(196), '#ff0000'); // 196 = 16 + 36*5
  assert.equal(xterm256ToHex(231), '#ffffff');
});

test('xterm256ToHex: 232-255 is the grayscale ramp', () => {
  assert.equal(xterm256ToHex(232), '#080808');
  assert.equal(xterm256ToHex(255), '#eeeeee');
});

// #endregion

// #region pi resolver

test('pi: var reference resolves through vars to a palette color', () => {
  const { colors } = resolvePi(piSeed, palette);
  // accent -> "cyan" -> vars.cyan = 6 -> palette slot 6
  assert.equal(colors.accent, palette.slots[6]);
});

test('pi: empty string resolves to terminal default — fg for text, bg for *Bg tokens', () => {
  const { colors } = resolvePi(piSeed, palette);
  assert.equal(colors.text, palette.foreground);
  assert.equal(colors.userMessageBg, palette.background);
});

test('pi: bare ints resolve by range — palette slot, cube, grayscale ramp', () => {
  const doc = { name: 't', vars: {}, colors: { accent: 3, border: 196, muted: 240 } };
  const { colors } = resolvePi(doc, palette);
  assert.equal(colors.accent, palette.slots[3]);
  assert.equal(colors.border, '#ff0000');
  assert.equal(colors.muted, xterm256ToHex(240));
});

test('pi: the vendored seed resolves with zero unresolved tokens', () => {
  const { colors, warnings } = resolvePi(piSeed, palette);
  for (const [token, value] of Object.entries(colors)) {
    assert.match(value, /^#[0-9a-f]{6}$/, `token ${token} unresolved: ${value}`);
  }
  assert.deepEqual(warnings, []);
});

test('pi: unknown var reference warns instead of crashing', () => {
  const doc = { name: 't', vars: {}, colors: { accent: 'nosuchvar' } };
  const { warnings } = resolvePi(doc, palette);
  assert.ok(warnings.some((w) => w.includes('nosuchvar')));
});

// #endregion

// #region claude resolver

test('claude: ansi: references hit the mapped palette slots', () => {
  const doc = { name: 't', base: 'light-ansi', overrides: { claude: 'ansi:cyan', ide: 'ansi:cyanBright' } };
  const { colors } = resolveClaude(doc, palette);
  assert.equal(colors.claude, palette.slots[6]);
  assert.equal(colors.ide, palette.slots[14]);
});

test('claude: ansi256(n), hex, and rgb() values resolve', () => {
  const doc = {
    name: 't',
    base: 'light-ansi',
    overrides: { claude: 'ansi256(196)', ide: '#123456', text: 'rgb(1,2,3)' },
  };
  const { colors } = resolveClaude(doc, palette);
  assert.equal(colors.claude, '#ff0000');
  assert.equal(colors.ide, '#123456');
  assert.equal(colors.text, 'rgb(1,2,3)');
});

test('claude: an overridden token wins, a non-overridden token shows the base value', () => {
  const { colors } = resolveClaude(claudeSeed, palette);
  // override: success -> ansi:cyan; base light-ansi: success -> ansi:green
  assert.equal(colors.success, palette.slots[6]);
  // not overridden: text -> base ansi:black -> slot 0
  assert.equal(colors.text, palette.slots[0]);
});

test('claude: the vendored seed resolves every schema token', () => {
  const { colors, warnings } = resolveClaude(claudeSeed, palette);
  for (const key of CLAUDE_KEYS) {
    assert.ok(colors[key], `token ${key} missing from resolution`);
  }
  assert.deepEqual(warnings, []);
});

test('claude: unknown override token warns instead of crashing', () => {
  const doc = { name: 't', base: 'light-ansi', overrides: { nosuchtoken: 'ansi:red' } };
  const { warnings } = resolveClaude(doc, palette);
  assert.ok(warnings.some((w) => w.includes('nosuchtoken')));
});

test('claude: unknown base is an explicit error', () => {
  assert.throws(() => resolveClaude({ name: 't', base: 'nope', overrides: {} }, palette), /base/);
});

// #endregion

// #region opencode resolver

test('opencode: bare int 0-15 resolves to the palette slot', () => {
  const { colors } = resolveOpencode(opencodeSeed, palette);
  assert.equal(colors.primary, palette.slots[6]);
  assert.equal(colors.error, palette.slots[1]);
});

test('opencode: none and transparent resolve to transparent', () => {
  const { colors } = resolveOpencode(opencodeSeed, palette);
  assert.equal(colors.background, 'transparent');
});

test('opencode: defs references resolve', () => {
  const doc = {
    defs: { brand: '#aabbcc' },
    theme: { ...opencodeSeed.theme, primary: 'brand' },
  };
  const { colors } = resolveOpencode(doc, palette);
  assert.equal(colors.primary, '#aabbcc');
});

test('opencode: theme tokens can alias other theme tokens', () => {
  const { colors } = resolveOpencode(opencodeSeed, palette);
  // seed: syntaxComment -> "textMuted" -> 8 -> palette slot 8
  assert.equal(colors.syntaxComment, palette.slots[8]);
});

test('opencode: {dark, light} variant survives load and resolves by declared mode', () => {
  const doc = {
    theme: { ...opencodeSeed.theme, primary: { dark: '#111111', light: '#eeeeee' } },
  };
  assert.equal(resolveOpencode(doc, palette, 'light').colors.primary, '#eeeeee');
  assert.equal(resolveOpencode(doc, palette, 'dark').colors.primary, '#111111');
});

test('opencode: circular reference is an explicit error', () => {
  const doc = { theme: { ...opencodeSeed.theme, primary: 'accent', accent: 'primary' } };
  assert.throws(() => resolveOpencode(doc, palette), /[Cc]ircular/);
});

test('opencode: the vendored seed resolves every token', () => {
  const { colors, warnings } = resolveOpencode(opencodeSeed, palette);
  for (const key of OPENCODE_KEYS) {
    assert.ok(colors[key] !== undefined, `token ${key} missing from resolution`);
  }
  assert.deepEqual(warnings, []);
});

// #endregion

// #region palette validation

test('a palette missing a slot is an explicit error in every resolver', () => {
  const broken = { ...palette, slots: palette.slots.slice(0, 15) };
  assert.throws(() => resolvePi(piSeed, broken), /slot/i);
  assert.throws(() => resolveClaude(claudeSeed, broken), /slot/i);
  assert.throws(() => resolveOpencode(opencodeSeed, broken), /slot/i);
});

// #endregion
