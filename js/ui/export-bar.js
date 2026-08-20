// Per-tool export: copy the native-dialect JSON to the clipboard (R18).
// Contract violations arm an inline warning before the copy; success shows
// a visible "Copied" confirmation; clipboard failure falls back to a
// selectable textarea.

import { serializeTheme } from '../export.js';
import { checkContract } from '../contract.js';

export function renderExportBar(container, store, tool) {
  const bar = document.createElement('div');
  bar.className = 'export-bar';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy theme JSON';

  const warning = document.createElement('span');
  warning.className = 'export-warning';
  warning.hidden = true;
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'danger';
  confirmBtn.textContent = 'Copy anyway';
  confirmBtn.hidden = true;
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.hidden = true;

  const status = document.createElement('span');
  status.className = 'export-status';
  status.hidden = true;

  const fallback = document.createElement('textarea');
  fallback.className = 'json-area';
  fallback.hidden = true;
  fallback.setAttribute('aria-label', `${tool} export fallback`);

  const armWarning = (armed, count = 0) => {
    warning.textContent = `${count} contract violation${count === 1 ? '' : 's'} — export anyway?`;
    warning.hidden = !armed;
    confirmBtn.hidden = !armed;
    cancelBtn.hidden = !armed;
    copyBtn.hidden = armed;
  };

  const showStatus = (text) => {
    status.textContent = text;
    status.hidden = false;
    setTimeout(() => { status.hidden = true; }, 2200);
  };

  const doCopy = async () => {
    const text = serializeTheme(tool, store.getState().themes[tool]);
    try {
      await navigator.clipboard.writeText(text);
      fallback.hidden = true;
      showStatus('Copied ✓');
    } catch {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      showStatus('Clipboard unavailable — select and copy below');
    }
  };

  copyBtn.addEventListener('click', () => {
    const violations = checkContract(tool, store.getState().themes[tool]);
    if (violations.length > 0) {
      armWarning(true, violations.length);
      return;
    }
    doCopy();
  });
  confirmBtn.addEventListener('click', () => { armWarning(false); doCopy(); });
  cancelBtn.addEventListener('click', () => armWarning(false));

  bar.append(copyBtn, warning, confirmBtn, cancelBtn, status);
  container.append(bar, fallback);
}
