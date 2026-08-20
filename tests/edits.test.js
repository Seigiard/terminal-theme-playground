import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  setPiToken, detachPiToken, piSiblings,
  setClaudeToken, clearClaudeOverride,
  setOpencodeToken,
  validateThemeDoc,
} from '../js/edits.js';
import { piSeed, claudeSeed, opencodeSeed } from './helpers.js';

// #region pi var coupling (R11)

test('pi: editing a var-backed token moves the shared var and all its siblings', () => {
  const doc = setPiToken(structuredClone(piSeed), 'muted', { kind: 'slot', slot: 7 });
  // "muted" is backed by vars.mutedText; the var moves, the ref stays.
  assert.equal(doc.vars.mutedText, 7);
  assert.equal(doc.colors.muted, 'mutedText');
  // every sibling still references the moved var
  const siblings = piSiblings(doc, 'muted');
  assert.equal(siblings.length, 11);
  assert.ok(siblings.includes('thinkingText'));
});

test('pi: detaching a token forks it to a literal and leaves siblings coupled', () => {
  const doc = detachPiToken(structuredClone(piSeed), 'muted');
  assert.equal(doc.colors.muted, 8); // literal copy of vars.mutedText
  assert.equal(doc.vars.mutedText, 8); // var untouched
  assert.equal(piSiblings(doc, 'thinkingText').length, 10); // one fewer
  assert.ok(!piSiblings(doc, 'thinkingText').includes('muted'));
});

test('pi: editing a literal token writes the value directly', () => {
  const doc = setPiToken(structuredClone(piSeed), 'text', { kind: 'slot', slot: 4 });
  assert.equal(doc.colors.text, 4);
  const doc2 = setPiToken(doc, 'text', { kind: 'default' });
  assert.equal(doc2.colors.text, '');
});

test('pi: the hex escape hatch writes hex (contract checker flags it)', () => {
  const doc = setPiToken(structuredClone(piSeed), 'accent', { kind: 'hex', hex: '#ff0000' });
  // accent is var-backed ("cyan"): hex moves the var, like any var-level edit
  assert.equal(doc.vars.cyan, '#ff0000');
});

// #endregion

// #region claude base/override layering (R12)

test('claude: a slot edit writes an ansi: override', () => {
  const doc = setClaudeToken(structuredClone(claudeSeed), 'text', { kind: 'slot', slot: 4 });
  assert.equal(doc.overrides.text, 'ansi:blue');
});

test('claude: clearing an override reverts the token to its base value', () => {
  const doc = clearClaudeOverride(structuredClone(claudeSeed), 'success');
  assert.ok(!('success' in doc.overrides));
});

test('claude: the hex escape hatch writes a hex override', () => {
  const doc = setClaudeToken(structuredClone(claudeSeed), 'claude', { kind: 'hex', hex: '#123456' });
  assert.equal(doc.overrides.claude, '#123456');
});

// #endregion

// #region opencode plain values (R13)

test('opencode: a slot edit writes a bare int', () => {
  const doc = setOpencodeToken(structuredClone(opencodeSeed), 'primary', { kind: 'slot', slot: 4 });
  assert.equal(doc.theme.primary, 4);
});

test('opencode: replacing a {dark, light} value collapses it to one value', () => {
  const doc = structuredClone(opencodeSeed);
  doc.theme.primary = { dark: '#111111', light: '#eeeeee' };
  const edited = setOpencodeToken(doc, 'primary', { kind: 'slot', slot: 6 });
  assert.equal(edited.theme.primary, 6);
});

test('opencode: transparent is a first-class edit value', () => {
  const doc = setOpencodeToken(structuredClone(opencodeSeed), 'backgroundPanel', { kind: 'transparent' });
  assert.equal(doc.theme.backgroundPanel, 'transparent');
});

// #endregion

// #region raw-JSON validation (R10, R9)

test('invalid JSON structure is rejected whole with an error', () => {
  assert.equal(validateThemeDoc('pi', { name: 't' }).ok, false);
  assert.equal(validateThemeDoc('claude', { name: 't', overrides: {} }).ok, false);
  assert.equal(validateThemeDoc('opencode', { defs: {} }).ok, false);
  assert.ok(validateThemeDoc('pi', { name: 't' }).error.length > 0);
});

test('pi: a default-kind edit on a var-backed token blanks only that token', () => {
  const doc = setPiToken(structuredClone(piSeed), 'muted', { kind: 'default' });
  assert.equal(doc.colors.muted, '');
  assert.equal(doc.vars.mutedText, 8); // the shared var and its referents stay
  assert.equal(doc.colors.thinkingText, 'mutedText');
});

test('opencode: one-sided and nested variants are rejected with precise errors', () => {
  const oneSided = structuredClone(opencodeSeed);
  oneSided.theme.primary = { dark: 2 };
  const r1 = validateThemeDoc('opencode', oneSided);
  assert.equal(r1.ok, false);
  assert.match(r1.error, /both "dark" and "light"/);

  const nested = structuredClone(opencodeSeed);
  nested.theme.primary = { dark: { dark: 2, light: 3 }, light: 4 };
  const r2 = validateThemeDoc('opencode', nested);
  assert.equal(r2.ok, false);
  assert.match(r2.error, /nested/);
});

test('integer color values outside 0-255 are rejected at validation time', () => {
  const pi = structuredClone(piSeed);
  pi.colors.accent = 300;
  assert.match(validateThemeDoc('pi', pi).error, /outside 0-255/);

  const oc = structuredClone(opencodeSeed);
  oc.theme.primary = -1;
  assert.match(validateThemeDoc('opencode', oc).error, /outside 0-255/);
});

test('valid docs pass validation, including out-of-select values (R9)', () => {
  assert.equal(validateThemeDoc('pi', piSeed).ok, true);
  assert.equal(validateThemeDoc('claude', claudeSeed).ok, true);
  assert.equal(validateThemeDoc('opencode', opencodeSeed).ok, true);

  const withAnsi256 = structuredClone(claudeSeed);
  withAnsi256.overrides.claude = 'ansi256(200)';
  const result = validateThemeDoc('claude', withAnsi256);
  assert.equal(result.ok, true);
  // validation never rewrites the doc (loading alone must not corrupt values)
  assert.equal(withAnsi256.overrides.claude, 'ansi256(200)');
});

// #endregion
