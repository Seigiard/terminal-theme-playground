// App wiring: fetch seeds, build the store, mount panels, drive tabs.

import { createStore } from './store.js';
import { renderPalettePanel } from './ui/palette-panel.js';
import { renderTokenEditor } from './ui/token-editor.js';
import { checkContract } from './contract.js';

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
      const count = checkContract(tab.dataset.tab, state.themes[tab.dataset.tab]).length;
      let flag = tab.querySelector('.tab-flag');
      if (count > 0) {
        if (!flag) {
          flag = document.createElement('span');
          flag.className = 'tab-flag';
          tab.append(flag);
        }
        flag.textContent = `⚠ ${count}`;
      } else if (flag) {
        flag.remove();
      }
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

  // Editors per tool; previews (U5) still placeholders.
  const editors = {};
  for (const tool of TOOLS) {
    editors[tool] = renderTokenEditor(
      document.getElementById(`editor-${tool}`),
      document.getElementById(`json-${tool}`),
      store,
      tool,
    );
    const preview = document.getElementById(`preview-${tool}`);
    if (!preview.hasChildNodes()) {
      preview.innerHTML = '<p class="placeholder">Live preview lands in U5.</p>';
    }
  }
  window.__editors = editors; // preview click-to-token hook (U5)
}

main().catch((error) => {
  const alert = document.createElement('p');
  alert.setAttribute('role', 'alert');
  alert.style.cssText = 'color:#a02020;padding:1rem';
  alert.textContent = `Failed to start: ${error.message}`;
  document.body.append(alert);
  console.error(error);
});
