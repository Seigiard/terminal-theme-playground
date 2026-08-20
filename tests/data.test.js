import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as claudeTokens from '../data/tokens/claude.js';
import * as opencodeTokens from '../data/tokens/opencode.js';
import * as piTokens from '../data/tokens/pi.js';
import { alabaster, flexoki, piSeed, claudeSeed, opencodeSeed } from './helpers.js';

const HEX = /^#[0-9a-f]{6}$/;

test('Alabaster palette carries the slot-7/15-equals-background collision', () => {
  assert.equal(alabaster.slots.length, 16);
  assert.equal(alabaster.slots[7], alabaster.background);
  assert.equal(alabaster.slots[15], alabaster.background);
  assert.equal(alabaster.background, '#f7f7f7');
});

test('both palettes carry 16 hex slots plus foreground and background', () => {
  for (const palette of [alabaster, flexoki]) {
    assert.equal(palette.slots.length, 16);
    for (const color of [...palette.slots, palette.foreground, palette.background]) {
      assert.match(color, HEX);
    }
  }
});

test('pi seed matches my-mac-setup verbatim shape: integer vars, terminal-default text', () => {
  assert.equal(piSeed.name, 'terminal');
  for (const [name, value] of Object.entries(piSeed.vars)) {
    assert.ok(Number.isInteger(value) && value >= 0 && value <= 15,
      `vars.${name} must be an ANSI palette index 0-15, got ${JSON.stringify(value)}`);
  }
  assert.equal(piSeed.colors.text, '');
  assert.equal(piSeed.colors.userMessageBg, '');
});

test('pi seed colors reference vars or terminal default, never hex', () => {
  for (const [token, value] of Object.entries(piSeed.colors)) {
    assert.ok(value === '' || value in piSeed.vars,
      `colors.${token} must be "" or a vars reference, got ${JSON.stringify(value)}`);
  }
});

test('pi token schema covers exactly the seed tokens', () => {
  assert.deepEqual(
    [...piTokens.ALL_KEYS].sort(),
    Object.keys(piSeed.colors).sort(),
  );
});

test('claude ansi map: 16 names to 16 distinct slots 0-15', () => {
  const slots = Object.values(claudeTokens.ANSI_SLOTS);
  assert.equal(slots.length, 16);
  assert.equal(new Set(slots).size, 16);
  for (const slot of slots) {
    assert.ok(Number.isInteger(slot) && slot >= 0 && slot <= 15);
  }
});

test('claude bases cover every schema token with slot-preserving values', () => {
  for (const base of ['light-ansi', 'dark-ansi']) {
    for (const key of claudeTokens.ALL_KEYS) {
      const value = claudeTokens.BASES[base][key];
      assert.ok(value !== undefined, `${base} missing token ${key}`);
    }
  }
  // light-ansi is fully slot-referencing; dark-ansi has one documented rgb() exception.
  for (const [key, value] of Object.entries(claudeTokens.BASES['light-ansi'])) {
    assert.ok(value.startsWith('ansi:'), `light-ansi.${key} is not an ansi: reference`);
    assert.ok(value.slice(5) in claudeTokens.ANSI_SLOTS,
      `light-ansi.${key} references unknown ansi name ${value}`);
  }
});

test('claude seed extends light-ansi with ansi: overrides only', () => {
  assert.equal(claudeSeed.base, 'light-ansi');
  for (const [token, value] of Object.entries(claudeSeed.overrides)) {
    assert.ok(value.startsWith('ansi:'), `overrides.${token} must start with ansi:`);
    assert.ok(claudeTokens.ALL_KEYS.includes(token),
      `overrides.${token} is not a known claude token`);
  }
});

test('opencode seed covers the full token set with palette-only values', () => {
  const themeKeys = Object.keys(opencodeSeed.theme);
  assert.deepEqual([...themeKeys].sort(), [...opencodeTokens.ALL_KEYS].sort());
  for (const [token, value] of Object.entries(opencodeSeed.theme)) {
    const isSlot = Number.isInteger(value) && value >= 0 && value <= 15;
    const isTransparent = value === 'transparent' || value === 'none';
    const isRef = typeof value === 'string' && themeKeys.includes(value);
    assert.ok(isSlot || isTransparent || isRef,
      `theme.${token} must be a slot 0-15, transparent, or a token ref, got ${JSON.stringify(value)}`);
  }
});

test('opencode seed mirrors generateSystem slot assignments where system uses slots', () => {
  for (const group of opencodeTokens.SCHEMA) {
    for (const { key, system } of group.keys) {
      if (typeof system === 'number') {
        assert.equal(opencodeSeed.theme[key], system,
          `theme.${key} should use generateSystem's slot ${system}`);
      }
    }
  }
});
