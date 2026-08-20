// Shared test fixtures: every test file loads the same vendored data, so the
// readers and the parsed seeds live here once. Paths resolve from tests/,
// which is also where every importing test file lives.

import { readFileSync } from 'node:fs';

export const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

export const readJson = (path) => JSON.parse(read(path));

export const alabaster = readJson('../data/palettes/alabaster.json');
export const flexoki = readJson('../data/palettes/flexoki-light.json');
export const piSeed = readJson('../data/seeds/pi.json');
export const claudeSeed = readJson('../data/seeds/claude.json');
export const opencodeSeed = readJson('../data/seeds/opencode.json');
