// opencode mock: panel layout, diff with line numbers, markdown, syntax,
// status bar. Surface-to-token mapping follows opencode-theme-studio's
// PreviewSurface (MIT) and the token table in data/tokens/opencode.js.

import { el } from './common.js';

export function buildOpencodeMock() {
  // The root paints the terminal background (R17); the inner surface carries
  // the theme's own `background` token — the seed resolves it to transparent
  // (real opencode keeps terminal transparency), which must reveal the
  // terminal bg beneath, never the page chrome.
  return el('div', { cls: 'mock-terminal' }, [
    el('div', { cls: 'mock-surface', bg: 'background' }, [
    el('p', { cls: 'mock-line' }, [
      el('span', { fg: 'primary', text: '■ opencode ' }),
      el('span', { fg: 'textMuted', text: 'v1 · ' }),
      el('span', { fg: 'info', text: 'session started' }),
    ]),

    el('div', { cls: 'mock-msg', bg: 'backgroundPanel', border: 'border' }, [
      el('span', { fg: 'secondary', text: 'you ' }),
      el('span', { fg: 'text', text: 'darken the muted text' }),
    ]),
    el('div', { cls: 'mock-msg', bg: 'backgroundElement', border: 'borderSubtle' }, [
      el('span', { fg: 'accent', text: 'agent ' }),
      el('span', { fg: 'text', text: 'Editing the theme… ' }),
      el('span', { fg: 'textMuted', text: 'reading defaults' }),
    ]),

    el('div', { cls: 'mock-diff', border: 'borderActive' }, [
      el('div', { fg: 'diffHunkHeader', text: '@@ vars @@' }),
      el('div', {}, [
        el('span', { cls: 'mock-lineno', fg: 'diffLineNumber', bg: 'diffRemovedLineNumberBg', text: '12 ' }),
        el('span', { bg: 'diffRemovedBg', fg: 'diffRemoved' }, [
          el('span', { text: '- mutedText: ' }),
          el('span', { fg: 'diffHighlightRemoved', text: '#6F6E69' }),
        ]),
      ]),
      el('div', {}, [
        el('span', { cls: 'mock-lineno', fg: 'diffLineNumber', bg: 'diffAddedLineNumberBg', text: '12 ' }),
        el('span', { bg: 'diffAddedBg', fg: 'diffAdded' }, [
          el('span', { text: '+ mutedText: ' }),
          el('span', { fg: 'diffHighlightAdded', text: '8' }),
        ]),
      ]),
      el('div', {}, [
        el('span', { cls: 'mock-lineno', fg: 'diffLineNumber', bg: 'diffContextBg', text: '13 ' }),
        el('span', { fg: 'diffContext', text: '  gray: 8' }),
      ]),
    ]),

    el('div', { cls: 'mock-md' }, [
      el('div', { fg: 'markdownHeading', cls: 'mock-md-h', text: '# Review' }),
      el('p', { cls: 'mock-line' }, [
        el('span', { fg: 'markdownText', text: 'See ' }),
        el('span', { fg: 'markdownLinkText', text: 'the docs' }),
        el('span', { fg: 'markdownLink', text: ' (opencode.ai/themes)' }),
        el('span', { fg: 'markdownText', text: ', ' }),
        el('span', { fg: 'markdownEmph', text: 'emphasis' }),
        el('span', { fg: 'markdownText', text: ' and ' }),
        el('span', { fg: 'markdownStrong', text: 'strong' }),
        el('span', { fg: 'markdownText', text: '.' }),
      ]),
      el('div', { cls: 'mock-quote', fg: 'markdownBlockQuote', border: 'markdownBlockQuote', text: 'Slots, not hex.' }),
      el('p', { cls: 'mock-line' }, [
        el('span', { fg: 'markdownListItem', text: '• ' }),
        el('span', { fg: 'markdownText', text: 'item · ' }),
        el('span', { fg: 'markdownListEnumeration', text: '1. ' }),
        el('span', { fg: 'markdownText', text: 'numbered · ' }),
        el('span', { fg: 'markdownCode', text: 'inline()' }),
      ]),
      el('div', { cls: 'mock-hr', bg: 'markdownHorizontalRule' }),
    ]),

    el('div', { cls: 'mock-code', border: 'borderSubtle' }, [
      el('div', {}, [
        el('span', { fg: 'syntaxComment', text: '// theme resolution' }),
      ]),
      el('div', { fg: 'markdownCodeBlock' }, [
        el('span', { fg: 'syntaxKeyword', text: 'func ' }),
        el('span', { fg: 'syntaxFunction', text: 'resolve' }),
        el('span', { fg: 'syntaxPunctuation', text: '(' }),
        el('span', { fg: 'syntaxVariable', text: 'slot ' }),
        el('span', { fg: 'syntaxType', text: 'int' }),
        el('span', { fg: 'syntaxPunctuation', text: ') ' }),
        el('span', { fg: 'syntaxOperator', text: '→ ' }),
        el('span', { fg: 'syntaxString', text: '"#448c37"' }),
        el('span', { fg: 'syntaxPunctuation', text: ' · ' }),
        el('span', { fg: 'syntaxNumber', text: '0xF' }),
      ]),
    ]),

    el('div', { cls: 'mock-status', bg: 'backgroundMenu', border: 'border' }, [
      el('span', { fg: 'success', text: '✓ tests ' }),
      el('span', { fg: 'warning', text: '⚠ 1 ' }),
      el('span', { fg: 'error', text: '✗ 0 ' }),
      el('span', { cls: 'mock-selected', bg: 'primary', fg: 'selectedListItemText', text: ' selected item ' }),
    ]),
    ]),
  ]);
}
