// Shared UI vocabulary: slot display names and hex-input validation, used by
// both the palette panel and the token editor.

export const SLOT_NAMES = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'br-black', 'br-red', 'br-green', 'br-yellow', 'br-blue', 'br-magenta', 'br-cyan', 'br-white',
];

// Returns the normalized lowercase hex color, or null when invalid.
export function normalizeHexInput(value) {
  const hex = String(value).trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : null;
}
