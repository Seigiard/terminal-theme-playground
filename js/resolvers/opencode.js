// opencode theme resolver: ({defs, theme}, palette, mode) -> { colors, warnings }.
// Semantics ported from opencode's resolveColor (sst/opencode@ad192a59,
// packages/tui/src/theme/index.ts) and opencode-theme-studio's resolveTheme.ts:
// hex passthrough, "none"/"transparent" -> transparent, reference strings look
// up defs first then theme tokens (with circular detection), {dark, light}
// variants resolve by mode, bare ints resolve numerically.
//
// Playground divergence, on purpose: the real tool routes bare ints through a
// hardcoded standard-16 table (ansiToRgba); the playground maps 0-15 through
// the live palette because previewing under a palette is the whole point (R14).

import { assertPalette, intToColor, isHexColor } from './xterm.js';

export function resolveOpencode(themeDoc, palette, mode = 'light') {
  assertPalette(palette);
  const defs = themeDoc.defs ?? {};
  const theme = themeDoc.theme ?? {};
  const colors = {};
  const warnings = [];

  const resolveValue = (value, token, chain) => {
    if (Number.isInteger(value)) return intToColor(value, palette);
    if (typeof value === 'string') {
      if (value === 'none' || value === 'transparent') return 'transparent';
      if (isHexColor(value)) return value;
      if (chain.includes(value)) {
        throw new Error(`circular color reference: ${[...chain, value].join(' -> ')}`);
      }
      const next = defs[value] ?? theme[value];
      if (next === undefined) {
        warnings.push(`token "${token}": reference "${value}" not found in defs or theme`);
        return palette.foreground;
      }
      return resolveValue(next, token, [...chain, value]);
    }
    if (value && typeof value === 'object' && ('dark' in value || 'light' in value)) {
      return resolveValue(value[mode], token, chain);
    }
    warnings.push(`token "${token}": unrecognized value ${JSON.stringify(value)}`);
    return palette.foreground;
  };

  for (const [token, value] of Object.entries(theme)) {
    colors[token] = resolveValue(value, token, [token]);
  }
  // Documented optional-key fallbacks from opencode's resolveTheme:
  // selectedListItemText falls back to background, backgroundMenu to
  // backgroundElement, when the doc omits them.
  if (!('selectedListItemText' in theme) && 'background' in colors) {
    colors.selectedListItemText = colors.background;
  }
  if (!('backgroundMenu' in theme) && 'backgroundElement' in colors) {
    colors.backgroundMenu = colors.backgroundElement;
  }
  return { colors, warnings };
}
