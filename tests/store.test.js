import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createStore, computeCollisions, STORAGE_KEY } from '../js/store.js';
import { alabaster, flexoki, piSeed, claudeSeed, opencodeSeed } from './helpers.js';

const seeds = {
  palettes: { alabaster, 'flexoki-light': flexoki },
  defaultPalette: 'alabaster',
  themes: { pi: piSeed, claude: claudeSeed, opencode: opencodeSeed },
};

const fakeStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};

test('store round-trips through storage and restores after reload', () => {
  const storage = fakeStorage();
  const store = createStore({ seeds, storage });
  store.setPaletteColor(7, '#123456');
  store.setActiveTab('pi');

  const reloaded = createStore({ seeds, storage });
  assert.equal(reloaded.getState().palette.slots[7], '#123456');
  assert.equal(reloaded.getState().activeTab, 'pi');
});

test('corrupted stored JSON falls back to seeds instead of crashing', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{not json!!' });
  const store = createStore({ seeds, storage });
  assert.equal(store.getState().palette.slots[7], seeds.palettes.alabaster.slots[7]);
});

test('valid JSON with a drifted shape falls back to seeds instead of crash-looping', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{"palette":{},"themes":{}}' });
  const store = createStore({ seeds, storage });
  assert.deepEqual(store.getState().palette.slots, seeds.palettes.alabaster.slots);
  assert.deepEqual(store.getState().themes.pi, seeds.themes.pi);
});

test('a throwing storage or subscriber does not break mutations', () => {
  const storage = fakeStorage();
  storage.setItem = () => { throw new Error('quota exceeded'); };
  const store = createStore({ seeds, storage });
  let notified = 0;
  store.subscribe(() => { throw new Error('bad subscriber'); });
  store.subscribe(() => { notified += 1; });
  store.setPaletteColor(3, '#123123');
  assert.equal(store.getState().palette.slots[3], '#123123');
  assert.equal(notified, 1); // the later subscriber still ran
});

test('setActiveTab does not mark the state dirty', () => {
  const store = createStore({ seeds, storage: fakeStorage() });
  store.setActiveTab('pi');
  assert.equal(store.isDirty(), false);
});

test('reset returns palette and all three theme docs to vendored seeds', () => {
  const storage = fakeStorage();
  const store = createStore({ seeds, storage });
  store.setPaletteColor(3, '#010101');
  store.setTheme('pi', { ...seeds.themes.pi, name: 'edited' });
  store.reset();

  const state = store.getState();
  assert.deepEqual(state.palette.slots, seeds.palettes.alabaster.slots);
  assert.deepEqual(state.themes.pi, seeds.themes.pi);
  assert.deepEqual(state.themes.claude, seeds.themes.claude);
  assert.deepEqual(state.themes.opencode, seeds.themes.opencode);
});

test('collision detection flags Alabaster slots 7 and 15 as background-identical', () => {
  const collisions = computeCollisions(seeds.palettes.alabaster);
  assert.ok(collisions.slots[7].some((c) => c.kind === 'background'));
  assert.ok(collisions.slots[15].some((c) => c.kind === 'background'));
  // 7 and 15 also duplicate each other
  assert.ok(collisions.slots[7].some((c) => c.kind === 'duplicate' && c.with === 15));
  assert.equal(collisions.slots[1].length, 0);
});

test('editing a colliding slot away clears its flag', () => {
  const storage = fakeStorage();
  const store = createStore({ seeds, storage });
  store.setPaletteColor(7, '#777700');
  const collisions = computeCollisions(store.getState().palette);
  assert.equal(collisions.slots[7].filter((c) => c.kind === 'background').length, 0);
  assert.ok(collisions.slots[15].some((c) => c.kind === 'background'));
});

test('preset switch replaces all 18 colors and marks state dirty', () => {
  const storage = fakeStorage();
  const store = createStore({ seeds, storage });
  store.applyPreset('flexoki-light');

  const { palette } = store.getState();
  const flexoki = seeds.palettes['flexoki-light'];
  assert.deepEqual(palette.slots, flexoki.slots);
  assert.equal(palette.foreground, flexoki.foreground);
  assert.equal(palette.background, flexoki.background);
  assert.equal(store.isDirty(), true);
});

test('subscribers are notified on every mutation', () => {
  const store = createStore({ seeds, storage: fakeStorage() });
  let calls = 0;
  store.subscribe(() => { calls += 1; });
  store.setPaletteColor(0, '#111111');
  store.setActiveTab('opencode');
  assert.equal(calls, 2);
});
