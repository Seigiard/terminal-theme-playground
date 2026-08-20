// App wiring: fetch seeds, build the store, mount panels, drive tabs.

import { createStore } from './store.js';
import { renderPalettePanel } from './ui/palette-panel.js';
import { renderTokenEditor } from './ui/token-editor.js';
import { checkContract } from './contract.js';
import { renderExportBar } from './ui/export-bar.js';
import { skinPreview, wireClicks } from './ui/previews/common.js';
import { buildPiMock } from './ui/previews/pi.js';
import { buildClaudeMock } from './ui/previews/claude.js';
import { buildOpencodeMock } from './ui/previews/opencode.js';
import { resolvePi } from './resolvers/pi.js';
import { resolveClaude } from './resolvers/claude.js';
import { resolveOpencode } from './resolvers/opencode.js';

const MOCKS = { pi: buildPiMock, claude: buildClaudeMock, opencode: buildOpencodeMock };

const RESOLVERS = {
  pi: (state) => resolvePi(state.themes.pi, state.palette),
  claude: (state) => resolveClaude(state.themes.claude, state.palette),
  opencode: (state) => resolveOpencode(state.themes.opencode, state.palette, state.opencodeMode),
};

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

  // Editors and mock previews per tool.
  const editors = {};
  for (const tool of TOOLS) {
    editors[tool] = renderTokenEditor(
      document.getElementById(`editor-${tool}`),
      document.getElementById(`json-${tool}`),
      store,
      tool,
    );

    renderExportBar(document.getElementById(`json-${tool}`), store, tool);

    const container = document.getElementById(`preview-${tool}`);
    const mock = MOCKS[tool]();
    container.append(mock);
    wireClicks(mock, (tokens) => {
      editors[tool].focusToken(tokens[0]);
      tokens.slice(1).forEach((token) => {
        document.getElementById(`row-${tool}-${token}`)?.classList.add('flash');
        setTimeout(() => {
          document.getElementById(`row-${tool}-${token}`)?.classList.remove('flash');
        }, 1600);
      });
    });

    const reskin = (state) => {
      try {
        skinPreview(mock, RESOLVERS[tool](state).colors, state.palette);
        mock.classList.remove('mock-broken');
      } catch {
        // An unresolvable doc (mid-edit) keeps the last good skin, dimmed.
        mock.classList.add('mock-broken');
      }
    };
    store.subscribe(reskin);
    reskin(store.getState());
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
