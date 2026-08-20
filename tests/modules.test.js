import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Deploy-gate smoke: the published page executes the js/ module graph, which
// the unit suites never import in full. Importing every module here makes a
// parse error or bad import specifier fail CI before Pages deploys it.

const root = fileURLToPath(new URL('..', import.meta.url));

const jsFiles = (dir) =>
  readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? jsFiles(path.join(dir, entry.name))
      : entry.name.endsWith('.js') ? [path.join(dir, entry.name)] : []);

test('every js/ and data/ module imports cleanly', async () => {
  const modules = [...jsFiles('js'), ...jsFiles('data')];
  assert.ok(modules.length >= 15, `expected the full module graph, found ${modules.length}`);
  for (const file of modules) {
    await assert.doesNotReject(
      import(new URL(`../${file.split(path.sep).join('/')}`, import.meta.url).href),
      `module ${file} failed to import`,
    );
  }
});

test('index.html references only files that exist', () => {
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="(?!data:|https?:)([^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.includes('js/app.js') && refs.includes('css/app.css'));
  for (const ref of refs) {
    assert.ok(existsSync(path.join(root, ref)), `index.html references missing file ${ref}`);
  }
});

test('the seed and palette files the app fetches at startup exist', () => {
  const app = readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const fetched = [...app.matchAll(/fetchJson\('([^']+)'\)/g)].map((m) => m[1]);
  assert.equal(fetched.length, 5);
  for (const file of fetched) {
    assert.ok(existsSync(path.join(root, file)), `app.js fetches missing file ${file}`);
  }
});
