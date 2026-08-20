import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { checkContract } from '../js/contract.js';

const readJson = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

const piSeed = readJson('../data/seeds/pi.json');
const claudeSeed = readJson('../data/seeds/claude.json');
const opencodeSeed = readJson('../data/seeds/opencode.json');

// Rules mirror the bats assertions in my-mac-setup tests/scripts.bats
// ("Pi terminal theme uses only terminal palette colors",
//  "Claude Code daltonized theme extends light ANSI with terminal colors").

test('pi: a hex string in vars is a violation', () => {
  const doc = structuredClone(piSeed);
  doc.vars.mutedText = '#6f6e69';
  const violations = checkContract('pi', doc);
  assert.ok(violations.some((v) => v.token === 'mutedText'));
});

test('pi: a hex value in colors is a violation', () => {
  const doc = structuredClone(piSeed);
  doc.colors.accent = '#ff0000';
  const violations = checkContract('pi', doc);
  assert.ok(violations.some((v) => v.token === 'accent'));
});

test('pi: non-empty colors.text or colors.userMessageBg is a violation', () => {
  const doc = structuredClone(piSeed);
  doc.colors.text = 'cyan';
  doc.colors.userMessageBg = 'softBg';
  const violations = checkContract('pi', doc);
  assert.ok(violations.some((v) => v.token === 'text'));
  assert.ok(violations.some((v) => v.token === 'userMessageBg'));
});

test('pi: a vars value outside 0-15 is a violation', () => {
  const doc = structuredClone(piSeed);
  doc.vars.gray = 240;
  const violations = checkContract('pi', doc);
  assert.ok(violations.some((v) => v.token === 'gray'));
});

test('claude: an override not starting with ansi: is a violation', () => {
  const doc = structuredClone(claudeSeed);
  doc.overrides.claude = '#ff8800';
  const violations = checkContract('claude', doc);
  assert.ok(violations.some((v) => v.token === 'claude'));
});

test('claude: a non-ANSI base is a violation', () => {
  const doc = structuredClone(claudeSeed);
  doc.base = 'light';
  const violations = checkContract('claude', doc);
  assert.ok(violations.some((v) => v.token === 'base'));
});

test('opencode: a hex or out-of-range int theme value is a violation', () => {
  const doc = structuredClone(opencodeSeed);
  doc.theme.primary = '#ff0000';
  doc.theme.accent = 196;
  const violations = checkContract('opencode', doc);
  assert.ok(violations.some((v) => v.token === 'primary'));
  assert.ok(violations.some((v) => v.token === 'accent'));
});

test('all three vendored seeds carry zero violations', () => {
  assert.deepEqual(checkContract('pi', piSeed), []);
  assert.deepEqual(checkContract('claude', claudeSeed), []);
  assert.deepEqual(checkContract('opencode', opencodeSeed), []);
});
