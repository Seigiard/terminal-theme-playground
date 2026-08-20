// Single state store: palette + three theme docs + UI state, storage-backed.
// Pure module (no DOM): the browser passes window.localStorage, tests pass a
// fake. Seeds are injected so Node tests can read them from disk while the
// browser fetches them.

export const STORAGE_KEY = 'terminal-theme-playground/v1';

const clone = (value) => structuredClone(value);

const normalizeHex = (color) => String(color).trim().toLowerCase();

// Collision map for the palette: for each slot, which collisions it carries.
// Consumed by both the palette panel (slot flags) and the token editor
// (flagging tokens that resolve to the background color).
export function computeCollisions(palette) {
  const bg = normalizeHex(palette.background);
  const slots = palette.slots.map(() => []);
  palette.slots.forEach((color, i) => {
    const hex = normalizeHex(color);
    if (hex === bg) slots[i].push({ kind: 'background' });
    palette.slots.forEach((other, j) => {
      if (j !== i && normalizeHex(other) === hex) {
        slots[i].push({ kind: 'duplicate', with: j });
      }
    });
  });
  return { slots, background: bg };
}

export function createStore({ seeds, storage }) {
  const seedState = () => ({
    palette: clone(seeds.palettes[seeds.defaultPalette]),
    themes: clone(seeds.themes),
    activeTab: 'claude',
    opencodeMode: 'light',
    dirty: false,
  });

  const load = () => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.palette || !parsed.themes) return seedState();
      return { ...seedState(), ...parsed };
    } catch {
      return seedState();
    }
  };

  let state = load();
  const listeners = new Set();

  const persist = () => {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable: the app keeps working, persistence stops.
    }
  };

  const notify = () => {
    persist();
    listeners.forEach((listener) => listener(state));
  };

  const mutate = (fn, { markDirty = true } = {}) => {
    fn(state);
    if (markDirty) state.dirty = true;
    notify();
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isDirty: () => state.dirty,

    setPaletteColor(slot, hex) {
      mutate((s) => {
        if (slot === 'foreground' || slot === 'background') s.palette[slot] = hex;
        else s.palette.slots[slot] = hex;
        s.palette.name = `${s.palette.name.replace(/ \(edited\)$/, '')} (edited)`;
      });
    },

    applyPreset(presetKey) {
      const preset = seeds.palettes[presetKey];
      if (!preset) throw new Error(`unknown palette preset "${presetKey}"`);
      mutate((s) => { s.palette = clone(preset); });
    },

    setTheme(tool, doc) {
      mutate((s) => { s.themes[tool] = doc; });
    },

    setActiveTab(tab) {
      mutate((s) => { s.activeTab = tab; }, { markDirty: false });
    },

    setOpencodeMode(mode) {
      mutate((s) => { s.opencodeMode = mode; });
    },

    reset() {
      state = seedState();
      notify();
    },
  };
}
