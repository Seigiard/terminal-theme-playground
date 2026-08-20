// Palette panel: 16 slot rows + foreground/background, preset dropdown,
// collision flags, and the seed-reset control (with an inline confirmation
// step — reset destroys all edits, R5).

import { computeCollisions } from '../store.js';
import { SLOT_NAMES, normalizeHexInput } from './shared.js';

export function renderPalettePanel(container, store, { presets }) {
  container.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'palette-head';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Palette preset');
  const placeholder = document.createElement('option');
  placeholder.textContent = 'Load preset…';
  placeholder.value = '';
  select.append(placeholder);
  for (const key of Object.keys(presets)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = presets[key].name;
    select.append(option);
  }
  select.addEventListener('change', () => {
    if (select.value) store.applyPreset(select.value);
    select.value = '';
  });
  head.append(select);
  container.append(head);

  const title = document.createElement('p');
  title.className = 'palette-name';
  container.append(title);

  const rows = new Map(); // key -> {swatch, hexInput, flag}
  const makeRow = (key, label) => {
    const row = document.createElement('div');
    row.className = 'palette-row';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const swatch = document.createElement('input');
    swatch.type = 'color';
    swatch.setAttribute('aria-label', `${label} swatch`);
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.spellcheck = false;
    hexInput.setAttribute('aria-label', `${label} hex`);
    const flag = document.createElement('span');
    flag.className = 'collision-flag';
    flag.hidden = true;

    swatch.addEventListener('input', () => store.setPaletteColor(key, swatch.value));
    hexInput.addEventListener('change', () => {
      const value = normalizeHexInput(hexInput.value);
      if (value) {
        hexInput.classList.remove('invalid');
        store.setPaletteColor(key, value);
      } else {
        hexInput.classList.add('invalid');
      }
    });

    row.append(labelEl, swatch, hexInput, flag);
    container.append(row);
    rows.set(key, { swatch, hexInput, flag });
  };

  makeRow('foreground', 'foreground');
  makeRow('background', 'background');
  SLOT_NAMES.forEach((name, i) => makeRow(i, `${i} ${name}`));

  const actions = document.createElement('div');
  actions.className = 'palette-actions';
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset to seeds…';
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm reset';
  confirmBtn.className = 'danger';
  confirmBtn.hidden = true;
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.hidden = true;

  const armReset = (armed) => {
    resetBtn.hidden = armed;
    confirmBtn.hidden = !armed;
    cancelBtn.hidden = !armed;
  };
  resetBtn.addEventListener('click', () => armReset(true));
  cancelBtn.addEventListener('click', () => armReset(false));
  confirmBtn.addEventListener('click', () => {
    armReset(false);
    store.reset();
  });
  actions.append(resetBtn, confirmBtn, cancelBtn);
  container.append(actions);

  const update = (state) => {
    // Any state change disarms a pending reset confirmation — the user's
    // attention has moved on, and a stale armed Confirm invites an
    // accidental destructive reset.
    armReset(false);
    const { palette } = state;
    title.textContent = palette.name;
    const collisions = computeCollisions(palette);

    const applyRow = (key, color, slotCollisions) => {
      const { swatch, hexInput, flag } = rows.get(key);
      swatch.value = color;
      if (document.activeElement !== hexInput) {
        hexInput.value = color;
        hexInput.classList.remove('invalid');
      }
      if (slotCollisions && slotCollisions.length > 0) {
        const parts = slotCollisions.map((c) =>
          c.kind === 'background' ? '= bg' : `= slot ${c.with}`);
        flag.textContent = [...new Set(parts)].join(', ');
        flag.hidden = false;
      } else {
        flag.hidden = true;
      }
    };

    applyRow('foreground', palette.foreground, null);
    applyRow('background', palette.background, null);
    palette.slots.forEach((color, i) => applyRow(i, color, collisions.slots[i]));
  };

  store.subscribe(update);
  update(store.getState());
}
