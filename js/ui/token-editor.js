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
  SLOT_TO_ANSI,
} from '../edits.js';
import { SLOT_NAMES, normalizeHexInput } from './shared.js';
import { checkContract } from '../contract.js';
import { resolvePi } from '../resolvers/pi.js';
import { resolveClaude } from '../resolvers/claude.js';
import { resolveOpencode } from '../resolvers/opencode.js';
import { computeCollisions } from '../store.js';

const SCHEMAS = { claude: CLAUDE_SCHEMA, opencode: OPENCODE_SCHEMA, pi: PI_SCHEMA };

// The "= bg" flag exists to catch TEXT that disappears into the background.
// Background-purpose tokens legitimately equal the background color (pi's
// userMessageBg is contract-required to), so they never carry the flag.
const isBackgroundToken = (tool, key) => {
  if (tool === 'pi') return /Bg$/.test(key);
  if (tool === 'claude') {
    return /background/i.test(key) || key === 'selectionBg' || key.startsWith('rate_limit_');
  }
  return /^background/.test(key) || /Bg$/.test(key);
};

// Extra args are ignored by the two-arg resolvers, so direct references work.
const RESOLVERS = { pi: resolvePi, claude: resolveClaude, opencode: resolveOpencode };

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
    // Lenient on purpose: an unknown base still displays (as light-ansi) so
    // the user can fix it; resolveClaude stays strict and throws instead.
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
                const value = normalizeHexInput(hexInput.value);
                if (value) {
                  noteVariantCollapse(info, key);
                  applyEdit(store, tool, key, { kind: 'hex', hex: value });
                }
              });
              select.after(hexInput);
              hexInput.focus();
              return;
            }
            if (select.value === 'default') {
              if (info.via) {
                transientWarning = {
                  token: key,
                  message: `Detached from var ${info.via}: terminal default applies per token, the var and its other tokens stay unchanged.`,
                };
              }
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
            const value = normalizeHexInput(hexInput.value);
            if (value) applyEdit(store, tool, key, { kind: 'hex', hex: value });
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

        // collision flag: a non-background token resolves to the background color (R4)
        const resolvedColor = resolved[key];
        if (!isBackgroundToken(tool, key)
          && typeof resolvedColor === 'string'
          && resolvedColor.toLowerCase() === collisions.background) {
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

    // Preserve the user's draft while it is being edited or was just
    // rejected — refilling would wipe the text they are trying to fix.
    if (document.activeElement !== jsonArea && jsonError.hidden) {
      jsonArea.value = JSON.stringify(doc, null, 2);
    }
  };

  // Every tool renders once on mount (the line after onState forces it even
  // for inactive tabs — the JSON view and row ids for click-to-token need to
  // exist). After that, re-renders run only while this tool's tab is active;
  // tab activation notifies subscribers, which triggers the catch-up render.
  const onState = (state) => {
    if (state.activeTab === tool) render(state);
  };
  store.subscribe(onState);
  onState(store.getState());
  if (store.getState().activeTab !== tool) render(store.getState());

  const flashToken = (token) => {
    const row = document.getElementById(`row-${tool}-${token}`);
    if (!row) return null;
    row.classList.add('flash');
    setTimeout(() => row.classList.remove('flash'), 1600);
    return row;
  };

  return {
    flashToken,
    focusToken(token) {
      const row = flashToken(token);
      row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
  };
}
