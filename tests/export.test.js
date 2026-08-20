import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { serializeTheme } from '../js/export.js';
import { setClaudeToken } from '../js/edits.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const readJson = (path) => JSON.parse(read(path));

const piSeed = readJson('../data/seeds/pi.json');
const claudeSeed = readJson('../data/seeds/claude.json');
const opencodeSeed = readJson('../data/seeds/opencode.json');

test('export of the untouched pi seed byte-matches the vendored file', () => {
  assert.equal(serializeTheme('pi', piSeed), read('../data/seeds/pi.json'));
});

test('claude export emits the minimal {name, base, overrides} diff', () => {
  const doc = setClaudeToken(structuredClone(claudeSeed), 'text', { kind: 'slot', slot: 4 });
  const exported = JSON.parse(serializeTheme('claude', doc));
  assert.deepEqual(Object.keys(exported), ['name', 'base', 'overrides']);
  // the one edit plus the original 14 overrides — never a flattened token dump
  assert.equal(Object.keys(exported.overrides).length, 15);
  assert.equal(exported.overrides.text, 'ansi:blue');
});

test('opencode export keeps {defs, theme} shape and omits an empty defs', () => {
  const bare = JSON.parse(serializeTheme('opencode', opencodeSeed));
  assert.deepEqual(Object.keys(bare), ['theme']);

  const withDefs = JSON.parse(
    serializeTheme('opencode', { defs: { brand: '#aabbcc' }, theme: opencodeSeed.theme }),
  );
  assert.deepEqual(Object.keys(withDefs), ['defs', 'theme']);
});

test('pi export preserves the vars/colors structure after an edit', () => {
  const doc = structuredClone(piSeed);
  doc.vars.mutedText = 7;
  const exported = JSON.parse(serializeTheme('pi', doc));
  assert.equal(exported.vars.mutedText, 7);
  assert.equal(exported.colors.muted, 'mutedText'); // still a var reference
  assert.deepEqual(Object.keys(exported), ['$schema', 'name', 'vars', 'colors']);
});
