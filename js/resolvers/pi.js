// pi theme resolver: ({name, vars, colors}, palette) -> { colors, warnings }.
// Dialect per pi docs (v0.84.2): a color value is 6-digit hex, an xterm
// 256-color index, a reference to a vars entry, or "" for the terminal's
// default color. vars values are indices or hex.

import { assertPalette, intToColor } from './xterm.js';

const isBgToken = (token) => /Bg$/.test(token);

export function resolvePi(themeDoc, palette) {
  assertPalette(palette);
  const vars = themeDoc.vars ?? {};
  const colors = {};
  const warnings = [];

  const resolveValue = (value, token) => {
    if (value === '') {
      return isBgToken(token) ? palette.background : palette.foreground;
    }
    if (Number.isInteger(value)) return intToColor(value, palette);
    if (typeof value === 'string' && value.startsWith('#')) return value;
    if (typeof value === 'string' && value in vars) {
      return resolveValue(vars[value], token);
    }
    warnings.push(`token "${token}": unknown value "${value}" (not a var, hex, index, or "")`);
    return palette.foreground;
  };

  for (const [token, value] of Object.entries(themeDoc.colors ?? {})) {
    colors[token] = resolveValue(value, token);
  }
  return { colors, warnings };
}
