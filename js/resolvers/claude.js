// Claude Code theme resolver: ({name, base, overrides}, palette) -> { colors, warnings }.
// Dialect: values are ansi:<name> slot references, ansi256(n), hex, or rgb().
// Resolution layers base values under overrides (an override wins per token).

import { ANSI_SLOTS, ALL_KEYS, BASES } from '../../data/tokens/claude.js';
import { assertPalette, intToColor, isHexColor, isRgbColor } from './xterm.js';

export function resolveClaude(themeDoc, palette) {
  assertPalette(palette);
  const base = BASES[themeDoc.base];
  if (!base) {
    throw new Error(`unknown claude base "${themeDoc.base}" (expected one of: ${Object.keys(BASES).join(', ')})`);
  }
  const overrides = themeDoc.overrides ?? {};
  const colors = {};
  const warnings = [];

  const resolveValue = (value, token) => {
    if (typeof value !== 'string') {
      warnings.push(`token "${token}": non-string value ${JSON.stringify(value)}`);
      return palette.foreground;
    }
    if (value.startsWith('ansi:')) {
      const name = value.slice(5);
      if (name in ANSI_SLOTS) return palette.slots[ANSI_SLOTS[name]];
      warnings.push(`token "${token}": unknown ansi name "${name}"`);
      return palette.foreground;
    }
    const ansi256 = value.match(/^ansi256\((\d+)\)$/);
    if (ansi256) return intToColor(Number(ansi256[1]), palette);
    if (isHexColor(value) || isRgbColor(value)) return value;
    warnings.push(`token "${token}": unrecognized value "${value}"`);
    return palette.foreground;
  };

  for (const key of ALL_KEYS) {
    colors[key] = resolveValue(overrides[key] ?? base[key], key);
  }
  for (const token of Object.keys(overrides)) {
    if (!ALL_KEYS.includes(token)) {
      warnings.push(`override "${token}" is not a known claude token`);
    }
  }
  return { colors, warnings };
}
