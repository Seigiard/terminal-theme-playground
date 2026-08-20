// Edit semantics for the three dialects: pure functions over theme docs.
// The token editor calls these and pushes the result into the store, so the
// coupling rules (pi vars, claude overrides, opencode collapse) are testable
// in Node without a DOM.

import { ANSI_SLOTS } from '../data/tokens/claude.js';

const SLOT_TO_ANSI = Object.fromEntries(
  Object.entries(ANSI_SLOTS).map(([name, slot]) => [slot, name]),
);

const editValue = (edit) => {
  if (edit.kind === 'slot') return edit.slot;
  if (edit.kind === 'default') return '';
  if (edit.kind === 'hex') return edit.hex;
  if (edit.kind === 'transparent') return 'transparent';
  throw new Error(`unknown edit kind "${edit.kind}"`);
};

// #region pi (R11: var-level editing)

const piBackingVar = (doc, token) => {
  const value = doc.colors[token];
  return typeof value === 'string' && value in (doc.vars ?? {}) ? value : null;
};

// Editing a var-backed token moves the shared var (all referencing tokens
// co-move); editing a literal token writes the value directly. "default"
// always writes "" at the token level — a var cannot hold "".
export function setPiToken(doc, token, edit) {
  const backingVar = piBackingVar(doc, token);
  if (edit.kind !== 'default' && backingVar) {
    doc.vars[backingVar] = editValue(edit);
  } else {
    doc.colors[token] = editValue(edit);
  }
  return doc;
}

// Forks the token off its var: the token gets the var's current value as a
// literal, the var and its other referents stay untouched.
export function detachPiToken(doc, token) {
  const backingVar = piBackingVar(doc, token);
  if (backingVar) doc.colors[token] = doc.vars[backingVar];
  return doc;
}

// The co-move set: every token referencing this token's backing var
// (including the token itself) — exactly what moves together on a var edit.
export function piSiblings(doc, token) {
  const backingVar = piBackingVar(doc, token);
  if (!backingVar) return [];
  return Object.entries(doc.colors)
    .filter(([, value]) => value === backingVar)
    .map(([other]) => other);
}

// #endregion

// #region claude (R12: base/override layering)

export function setClaudeToken(doc, token, edit) {
  if (!doc.overrides) doc.overrides = {};
  doc.overrides[token] = edit.kind === 'slot' ? `ansi:${SLOT_TO_ANSI[edit.slot]}` : editValue(edit);
  return doc;
}

export function clearClaudeOverride(doc, token) {
  if (doc.overrides) delete doc.overrides[token];
  return doc;
}

// #endregion

// #region opencode (R13: plain single values; variants collapse on edit)

export function setOpencodeToken(doc, token, edit) {
  doc.theme[token] = editValue(edit);
  return doc;
}

// #endregion

// #region raw-JSON dialect validation (R10)

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const VALIDATORS = {
  pi(doc) {
    if (!isObject(doc)) return 'document must be a JSON object';
    if (!isObject(doc.vars)) return 'pi theme needs a "vars" object';
    if (!isObject(doc.colors)) return 'pi theme needs a "colors" object';
    for (const [name, value] of Object.entries(doc.vars)) {
      if (!Number.isInteger(value) && typeof value !== 'string') {
        return `vars.${name} must be an index or a color string`;
      }
    }
    for (const [token, value] of Object.entries(doc.colors)) {
      if (!Number.isInteger(value) && typeof value !== 'string') {
        return `colors.${token} must be an index, a var reference, hex, or ""`;
      }
    }
    return null;
  },
  claude(doc) {
    if (!isObject(doc)) return 'document must be a JSON object';
    if (typeof doc.base !== 'string') return 'claude theme needs a "base" string';
    if (!isObject(doc.overrides)) return 'claude theme needs an "overrides" object';
    for (const [token, value] of Object.entries(doc.overrides)) {
      if (typeof value !== 'string') return `overrides.${token} must be a string`;
    }
    return null;
  },
  opencode(doc) {
    if (!isObject(doc)) return 'document must be a JSON object';
    if (!isObject(doc.theme)) return 'opencode theme needs a "theme" object';
    if (doc.defs !== undefined && !isObject(doc.defs)) return '"defs" must be an object';
    for (const [token, value] of Object.entries(doc.theme)) {
      if (token === 'thinkingOpacity') {
        if (typeof value !== 'number') return 'thinkingOpacity must be a number';
        continue;
      }
      const isVariant = isObject(value) && ('dark' in value || 'light' in value);
      if (!Number.isInteger(value) && typeof value !== 'string' && !isVariant) {
        return `theme.${token} must be an int, string, or {dark, light} object`;
      }
    }
    return null;
  },
};

// Validation only — never mutates or normalizes the doc, so values legal in
// the dialect but outside the select set survive load untouched (R9).
export function validateThemeDoc(tool, doc) {
  const validate = VALIDATORS[tool];
  if (!validate) throw new Error(`unknown tool "${tool}"`);
  const error = validate(doc);
  return error ? { ok: false, error } : { ok: true, error: null };
}

// #endregion
