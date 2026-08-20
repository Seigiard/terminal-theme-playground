// App wiring: fetch seeds, build the store, mount panels, drive tabs.

import { createStore } from './store.js';
import { renderPalettePanel } from './ui/palette-panel.js';

const TOOLS = ['claude', 'opencode', 'pi'];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to load ${url}: ${response.status}`);
  return response.json();
}

async function loadSeeds() {
  const [alabaster, flexoki, pi, claude, opencode] = await Promise.all([
    fetchJson('data/palettes/alabaster.json'),
    fetchJson('data/palettes/flexoki-light.json'),
    fetchJson('data/seeds/pi.json'),
    fetchJson('data/seeds/claude.json'),
    fetchJson('data/seeds/opencode.json'),
  ]);
  return {
    palettes: { alabaster, 'flexoki-light': flexoki },
    defaultPalette: 'alabaster',
    themes: { pi, claude, opencode },
  };
}

function setupTabs(store) {
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = [...document.querySelectorAll('.tab-panel')];

  const update = (state) => {
    tabs.forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.tab === state.activeTab));
    });
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.panel === state.activeTab);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => store.setActiveTab(tab.dataset.tab));
  });
  store.subscribe(update);
  update(store.getState());
}

async function main() {
  const seeds = await loadSeeds();
  const store = createStore({ seeds, storage: window.localStorage });

  renderPalettePanel(document.getElementById('palette-panel'), store, {
    presets: seeds.palettes,
  });
  setupTabs(store);

  // Editor (U4) and preview (U5) mount points; placeholders until those land.
  for (const tool of TOOLS) {
    const editor = document.getElementById(`editor-${tool}`);
    const preview = document.getElementById(`preview-${tool}`);
    const json = document.getElementById(`json-${tool}`);
    if (!editor.hasChildNodes()) {
      editor.innerHTML = '<p class="placeholder">Token editor lands in U4.</p>';
      preview.innerHTML = '<p class="placeholder">Live preview lands in U5.</p>';
      json.innerHTML = '<p class="placeholder">Raw JSON view lands in U4.</p>';
    }
  }
}

main().catch((error) => {
  const alert = document.createElement('p');
  alert.setAttribute('role', 'alert');
  alert.style.cssText = 'color:#a02020;padding:1rem';
  alert.textContent = `Failed to start: ${error.message}`;
  document.body.append(alert);
  console.error(error);
});
