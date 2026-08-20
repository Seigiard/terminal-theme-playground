// Per-tool token editor: rows with slot selects, pi var coupling, claude
// base/override layering, contract + collision flags, out-of-select chips
// (R9), and the bidirectional raw-JSON view (R10).

import { SCHEMA as CLAUDE_SCHEMA, BASES, ANSI_SLOTS } from '../../data/tokens/claude.js';
import { SCHEMA as OPENCODE_SCHEMA } from '../../data/tokens/opencode.js';
import { SCHEMA as PI_SCHEMA } from '../../data/tokens/pi.js';
import {
  setPiToken, detachPiToken, piSiblings,
  setClaudeToken, clearClaudeOverride,
  setOpencodeToken,
  validateThemeDoc,
} from '../edits.js';
import { checkContract } from '../contract.js';
import { resolvePi } from '../resolvers/pi.js';
import { resolveClaude } from '../resolvers/claude.js';
import { resolveOpencode } from '../resolvers/opencode.js';
import { computeCollisions } from '../store.js';

const SLOT_NAMES = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'br-black', 'br-red', 'br-green', 'br-yellow', 'br-blue', 'br-magenta', 'br-cyan', 'br-white',
];

const SLOT_TO_ANSI = Object.fromEntries(
  Object.entries(ANSI_SLOTS).map(([name, slot]) => [slot, name]),
);

const SCHEMAS = { claude: CLAUDE_SCHEMA, opencode: OPENCODE_SCHEMA, pi: PI_SCHEMA };

const RESOLVERS = {
  pi: (doc, palette) => resolvePi(doc, palette),
  claude: (doc, palette) => resolveClaude(doc, palette),
  opencode: (doc, palette, mode) => resolveOpencode(doc, palette, mode),
};

// Classifies a token's current raw value into an editor control state.
function classifyValue(tool, doc, token) {
  if (tool === 'pi') {
    const raw = doc.colors[token];
    if (raw === '') return { control: 'default' };
    if (typeof raw === 'string' && raw in (doc.vars ?? {})) {
      const varValue = doc.vars[raw];
      const base = { via: raw, siblings: piSiblings(doc, token) };
      if (Number.isInteger(varValue) && varValue >= 0 && varValue <= 15) {
        return { ...base, control: 'slot', slot: varValue };
      }
      if (typeof varValue === 'string' && varValue.startsWith('#')) {
        return { ...base, control: 'hex', hex: varValue };
      }
      return { ...base, control: 'chip', display: JSON.stringify(varValue) };
    }
    if (Number.isInteger(raw) && raw >= 0 && raw <= 15) return { control: 'slot', slot: raw };
    if (typeof raw === 'string' && raw.startsWith('#')) return { control: 'hex', hex: raw };
    return { control: 'chip', display: JSON.stringify(raw) };
  }

  if (tool === 'claude') {
    const isOverride = token in (doc.overrides ?? {});
    const raw = (doc.overrides ?? {})[token] ?? (BASES[doc.base] ?? BASES['light-ansi'])[token];
    const base = { isOverride };
    if (typeof raw === 'string' && raw.startsWith('ansi:') && raw.slice(5) in ANSI_SLOTS) {
      return { ...base, control: 'slot', slot: ANSI_SLOTS[raw.slice(5)] };
    }
    if (typeof raw === 'string' && raw.startsWith('#')) return { ...base, control: 'hex', hex: raw };
    return { ...base, control: 'chip', display: String(raw) };
  }

  // opencode
  const raw = doc.theme[token];
  if (Number.isInteger(raw) && raw >= 0 && raw <= 15) return { control: 'slot', slot: raw };
  if (raw === 'none' || raw === 'transparent') return { control: 'transparent' };
  if (typeof raw === 'string' && raw.startsWith('#')) return { control: 'hex', hex: raw };
  if (raw && typeof raw === 'object') {
    return { control: 'chip', display: JSON.stringify(raw), isVariant: true };
  }
  return { control: 'chip', display: JSON.stringify(raw) };
}

function applyEdit(store, tool, token, edit) {
  const doc = structuredClone(store.getState().themes[tool]);
  if (tool === 'pi') setPiToken(doc, token, edit);
  else if (tool === 'claude') setClaudeToken(doc, token, edit);
  else setOpencodeToken(doc, token, edit);
  store.setTheme(tool, doc);
}

// Maps contract violations to row tokens; pi vars violations flag every row
// backed by that var, claude "base" violations surface on the tab banner.
function violationsByToken(tool, doc) {
  const map = new Map();
  const add = (token, message) => {
    if (!map.has(token)) map.set(token, []);
    map.get(token).push(message);
  };
  for (const violation of checkContract(tool, doc)) {
    if (tool === 'pi' && violation.token in (doc.vars ?? {})) {
      for (const [token, value] of Object.entries(doc.colors ?? {})) {
        if (value === violation.token) add(token, violation.message);
      }
    }
    add(violation.token, violation.message);
  }
  return map;
}

export function renderTokenEditor(editorEl, jsonEl, store, tool) {
  const schema = SCHEMAS[tool];
  let transientWarning = null; // {token, message} shown until the next edit

  const jsonArea = document.createElement('textarea');
  jsonArea.className = 'json-area';
  jsonArea.spellcheck = false;
  jsonArea.setAttribute('aria-label', `${tool} raw JSON`);
  const jsonError = document.createElement('p');
  jsonError.className = 'json-error';
  jsonError.hidden = true;
  const jsonApply = document.createElement('button');
  jsonApply.textContent = 'Apply JSON';
  jsonApply.addEventListener('click', () => {
    let parsed;
    try {
      parsed = JSON.parse(jsonArea.value);
    } catch (error) {
      jsonError.textContent = `Invalid JSON: ${error.message}`;
      jsonError.hidden = false;
      return; // prior state stays intact (R10)
    }
    const { ok, error } = validateThemeDoc(tool, parsed);
    if (!ok) {
      jsonError.textContent = `Rejected: ${error}`;
      jsonError.hidden = false;
      return;
    }
    jsonError.hidden = true;
    store.setTheme(tool, parsed);
  });
  const jsonTitle = document.createElement('h3');
  jsonTitle.textContent = 'Raw JSON';
  jsonEl.innerHTML = '';
  jsonEl.append(jsonTitle, jsonArea, jsonApply, jsonError);

  const render = (state) => {
    const doc = state.themes[tool];
    const palette = state.palette;
    const violations = violationsByToken(tool, doc);
    const collisions = computeCollisions(palette);
    let resolved = {};
    try {
      resolved = RESOLVERS[tool](doc, palette, state.opencodeMode).colors;
    } catch {
      resolved = {};
    }

    const focusedId = document.activeElement?.id;
    editorEl.innerHTML = '';

    // Tab-level banner for doc-level violations (e.g. claude non-ANSI base).
    const docLevel = [...(violations.get('base') ?? [])];
    if (docLevel.length > 0) {
      const banner = document.createElement('p');
      banner.className = 'contract-banner';
      banner.textContent = docLevel.join('; ');
      editorEl.append(banner);
    }

    for (const group of schema) {
      const heading = document.createElement('h3');
      heading.className = 'token-group';
      heading.textContent = group.group;
      editorEl.append(heading);

      for (const { key, hint } of group.keys) {
        const info = classifyValue(tool, doc, key);
        const row = document.createElement('div');
        row.className = 'token-row';
        row.id = `row-${tool}-${key}`;
        row.dataset.token = key;
        if (info.via) row.dataset.var = info.via;

        const name = document.createElement('span');
        name.className = 'token-name';
        name.textContent = key;
        name.title = hint;
        const hintEl = document.createElement('span');
        hintEl.className = 'token-hint';
        hintEl.textContent = hint;
        row.append(name, hintEl);

        const control = document.createElement('span');
        control.className = 'token-control';

        const makeSelect = (current) => {
          const select = document.createElement('select');
          select.id = `select-${tool}-${key}`;
          select.setAttribute('aria-label', `${key} value`);
          const options = [];
          if (tool === 'pi') options.push({ value: 'default', label: 'terminal default' });
          if (tool === 'opencode') options.push({ value: 'transparent', label: 'transparent' });
          SLOT_NAMES.forEach((slotName, slot) => {
            const label = tool === 'claude'
              ? `${slot} ansi:${SLOT_TO_ANSI[slot]}`
              : `${slot} ${slotName}`;
            options.push({ value: `slot:${slot}`, label });
          });
          options.push({ value: 'hex', label: 'hex…' });
          if (current === undefined) {
            options.unshift({ value: 'keep', label: '(replace…)' });
          }
          for (const { value, label } of options) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.append(option);
          }
          select.value = current ?? 'keep';
          select.addEventListener('change', () => {
            if (select.value === 'keep') return;
            if (select.value === 'hex') {
              const hexInput = document.createElement('input');
              hexInput.type = 'text';
              hexInput.placeholder = '#rrggbb';
              hexInput.className = 'hex-input';
              hexInput.addEventListener('change', () => {
                const value = hexInput.value.trim().toLowerCase();
                if (/^#[0-9a-f]{6}$/.test(value)) {
                  noteVariantCollapse(info, key);
                  applyEdit(store, tool, key, { kind: 'hex', hex: value });
                }
              });
              select.after(hexInput);
              hexInput.focus();
              return;
            }
            if (select.value === 'default') {
              applyEdit(store, tool, key, { kind: 'default' });
              return;
            }
            if (select.value === 'transparent') {
              noteVariantCollapse(info, key);
              applyEdit(store, tool, key, { kind: 'transparent' });
              return;
            }
            const slot = Number(select.value.slice(5));
            noteVariantCollapse(info, key);
            applyEdit(store, tool, key, { kind: 'slot', slot });
          });
          return select;
        };

        const noteVariantCollapse = (valueInfo, token) => {
          if (valueInfo.isVariant) {
            transientWarning = {
              token,
              message: 'Replaced the {dark, light} variant with a single value for both modes.',
            };
          } else {
            transientWarning = null;
          }
        };

        if (info.control === 'slot') {
          control.append(makeSelect(`slot:${info.slot}`));
        } else if (info.control === 'default') {
          control.append(makeSelect('default'));
        } else if (info.control === 'transparent') {
          control.append(makeSelect('transparent'));
        } else if (info.control === 'hex') {
          const select = makeSelect('hex');
          const hexInput = document.createElement('input');
          hexInput.type = 'text';
          hexInput.className = 'hex-input';
          hexInput.id = `hex-${tool}-${key}`;
          hexInput.value = info.hex;
          hexInput.addEventListener('change', () => {
            const value = hexInput.value.trim().toLowerCase();
            if (/^#[0-9a-f]{6}$/.test(value)) {
              applyEdit(store, tool, key, { kind: 'hex', hex: value });
            }
          });
          control.append(select, hexInput);
        } else {
          // Out-of-select value: read-only chip until actively replaced (R9).
          const chip = document.createElement('code');
          chip.className = 'value-chip';
          chip.textContent = info.display;
          chip.title = 'Value outside the slot set — kept as-is until you replace it';
          control.append(chip, makeSelect(undefined));
        }
        row.append(control);

        // pi var coupling (R11)
        if (info.via) {
          const viaBadge = document.createElement('button');
          viaBadge.className = 'badge via-badge';
          viaBadge.textContent = `var ${info.via} ×${info.siblings.length}`;
          viaBadge.title = `Editing moves every token on this var: ${info.siblings.join(', ')}`;
          viaBadge.addEventListener('mouseenter', () => {
            editorEl.querySelectorAll(`[data-var="${info.via}"]`)
              .forEach((el) => el.classList.add('co-move'));
          });
          viaBadge.addEventListener('mouseleave', () => {
            editorEl.querySelectorAll('.co-move')
              .forEach((el) => el.classList.remove('co-move'));
          });
          const detach = document.createElement('button');
          detach.className = 'badge';
          detach.textContent = 'detach';
          detach.title = 'Fork this token off the shared var to a literal value';
          detach.addEventListener('click', () => {
            const next = structuredClone(store.getState().themes.pi);
            detachPiToken(next, key);
            store.setTheme('pi', next);
          });
          row.append(viaBadge, detach);
        }

        // claude base/override distinction (R12)
        if (tool === 'claude') {
          if (info.isOverride) {
            const clear = document.createElement('button');
            clear.className = 'badge override-badge';
            clear.textContent = 'override ✕';
            clear.title = 'Clear the override, reverting to the base value';
            clear.addEventListener('click', () => {
              const next = structuredClone(store.getState().themes.claude);
              clearClaudeOverride(next, key);
              store.setTheme('claude', next);
            });
            row.append(clear);
          } else {
            const baseBadge = document.createElement('span');
            baseBadge.className = 'badge base-badge';
            baseBadge.textContent = 'base';
            row.append(baseBadge);
          }
        }

        // contract flags (R8)
        const rowViolations = violations.get(key) ?? [];
        if (rowViolations.length > 0) {
          const flag = document.createElement('span');
          flag.className = 'badge contract-flag';
          flag.textContent = 'breaks contract';
          flag.title = rowViolations.join('\n');
          row.append(flag);
        }

        // collision flag: token resolves to the background color (R4)
        const resolvedColor = resolved[key];
        if (typeof resolvedColor === 'string'
          && resolvedColor.toLowerCase() === palette.background.toLowerCase()
          && collisions.background === resolvedColor.toLowerCase()) {
          const flag = document.createElement('span');
          flag.className = 'badge collision-badge';
          flag.textContent = '= bg';
          flag.title = 'Resolves to the background color — invisible as text';
          row.append(flag);
        }

        if (transientWarning && transientWarning.token === key) {
          const warning = document.createElement('p');
          warning.className = 'row-warning';
          warning.textContent = transientWarning.message;
          row.append(warning);
        }

        editorEl.append(row);
      }
    }

    if (focusedId) document.getElementById(focusedId)?.focus();

    if (document.activeElement !== jsonArea) {
      jsonArea.value = JSON.stringify(doc, null, 2);
    }
  };

  store.subscribe(render);
  render(store.getState());

  return {
    focusToken(token) {
      const row = document.getElementById(`row-${tool}-${token}`);
      if (!row) return;
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      row.classList.add('flash');
      setTimeout(() => row.classList.remove('flash'), 1600);
    },
  };
}
