// xterm 256-color helpers shared by the three resolvers.
// 16-231: 6x6x6 color cube; 232-255: 24-step grayscale ramp.

const CUBE_LEVELS = [0, 95, 135, 175, 215, 255];

const toHex = (r, g, b) =>
  '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');

export function xterm256ToHex(n) {
  if (!Number.isInteger(n) || n < 16 || n > 255) {
    throw new Error(`xterm256ToHex expects an integer 16-255, got ${n}`);
  }
  if (n <= 231) {
    const i = n - 16;
    return toHex(
      CUBE_LEVELS[Math.floor(i / 36)],
      CUBE_LEVELS[Math.floor(i / 6) % 6],
      CUBE_LEVELS[i % 6],
    );
  }
  const gray = 8 + 10 * (n - 232);
  return toHex(gray, gray, gray);
}

// Validates the playground palette shape; every resolver calls this first so a
// malformed palette fails loudly instead of resolving to undefined colors.
export function assertPalette(palette) {
  if (!palette || !Array.isArray(palette.slots) || palette.slots.length !== 16) {
    throw new Error('palette must carry exactly 16 slots');
  }
  palette.slots.forEach((color, i) => {
    if (typeof color !== 'string' || color === '') {
      throw new Error(`palette missing slot ${i}`);
    }
  });
  for (const key of ['foreground', 'background']) {
    if (typeof palette[key] !== 'string' || palette[key] === '') {
      throw new Error(`palette missing ${key}`);
    }
  }
}

// Shared int-value resolution: 0-15 -> live palette slot, 16-255 -> xterm.
export function intToColor(n, palette) {
  if (n >= 0 && n <= 15) return palette.slots[n];
  return xterm256ToHex(n);
}
