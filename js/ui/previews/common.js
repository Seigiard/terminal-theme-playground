// Shared preview machinery (KTD7): resolver output lands as CSS custom
// properties on the preview root; mock markup declares its tokens via
// data-uses, which drives both the skin and click-to-token navigation (R15).
// Technique from claude-theme-builder (MIT).

// Tiny element builder: fg/bg/border take TOKEN NAMES, not colors — the
// actual color arrives via the CSS variable the skin sets.
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  const { cls, text, uses, fg, bg, border, ...rest } = props;
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  const used = new Set(uses ?? []);
  const prefix = 'var(--t-';
  if (fg) { node.style.color = `${prefix}${fg})`; used.add(fg); }
  if (bg) { node.style.background = `${prefix}${bg})`; used.add(bg); }
  if (border) { node.style.borderColor = `${prefix}${border})`; used.add(border); }
  if (used.size > 0) node.dataset.uses = [...used].join(',');
  for (const [key, value] of Object.entries(rest)) node.setAttribute(key, value);
  for (const child of children) node.append(child);
  return node;
}

// Applies resolver output as --t-<token> variables on the preview root.
// Stale variables from a previous doc are cleared first, so a doc with fewer
// tokens never keeps painting the old theme's colors.
const appliedTokens = new WeakMap();

export function skinPreview(root, colors, palette) {
  root.style.setProperty('--t-terminal-bg', palette.background);
  root.style.setProperty('--t-terminal-fg', palette.foreground);
  const previous = appliedTokens.get(root) ?? new Set();
  const current = new Set(Object.keys(colors));
  for (const token of previous) {
    if (!current.has(token)) root.style.removeProperty(`--t-${token}`);
  }
  for (const [token, color] of Object.entries(colors)) {
    root.style.setProperty(`--t-${token}`, color);
  }
  appliedTokens.set(root, current);
}

// Click on any [data-uses] surface navigates to its first token and flashes
// the whole set in the editor.
export function wireClicks(root, onTokens) {
  root.addEventListener('click', (event) => {
    const surface = event.target.closest('[data-uses]');
    if (!surface || !root.contains(surface)) return;
    onTokens(surface.dataset.uses.split(','));
  });
}
