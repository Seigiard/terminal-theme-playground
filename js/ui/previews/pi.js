// pi mock: transcript with user/custom messages, tool boxes, markdown,
// diff, syntax highlighting, and the status/border hierarchy. Structure
// follows the token purposes in the official docs table (data/tokens/pi.js).

import { el } from './common.js';

export function buildPiMock() {
  return el('div', { cls: 'mock-terminal', uses: [] }, [
    el('div', { cls: 'mock-msg', bg: 'userMessageBg', fg: 'userMessageText', uses: [] }, [
      el('span', { text: '> make the muted text darker', fg: 'userMessageText' }),
    ]),
    el('p', { cls: 'mock-line', fg: 'text', text: 'I will check the theme file first.' }),
    el('p', { cls: 'mock-line', fg: 'thinkingText', text: 'Thinking: slot 8 is the only readable gray…' }),

    el('div', { cls: 'mock-tool', bg: 'toolPendingBg', border: 'borderMuted' }, [
      el('span', { cls: 'mock-tool-title', fg: 'toolTitle', text: 'Read theme.json ' }),
      el('span', { fg: 'warning', text: '● pending' }),
    ]),
    el('div', { cls: 'mock-tool', bg: 'toolSuccessBg', border: 'borderMuted' }, [
      el('span', { cls: 'mock-tool-title', fg: 'toolTitle', text: 'Edit theme.json ' }),
      el('span', { fg: 'success', text: '✓ ok' }),
      el('div', { cls: 'mock-tool-out', fg: 'toolOutput', text: 'updated 4 vars' }),
    ]),
    el('div', { cls: 'mock-tool', bg: 'toolErrorBg', border: 'borderMuted' }, [
      el('span', { cls: 'mock-tool-title', fg: 'toolTitle', text: 'bats tests ' }),
      el('span', { fg: 'error', text: '✗ 1 failing' }),
    ]),

    el('div', { cls: 'mock-diff', border: 'borderMuted' }, [
      el('div', { fg: 'toolDiffContext', text: '  "vars": {' }),
      el('div', { fg: 'toolDiffRemoved', text: '-   "mutedText": "#6F6E69",' }),
      el('div', { fg: 'toolDiffAdded', text: '+   "mutedText": 8,' }),
      el('div', { fg: 'toolDiffContext', text: '  }' }),
    ]),

    el('div', { cls: 'mock-md' }, [
      el('div', { fg: 'mdHeading', cls: 'mock-md-h', text: '## Result' }),
      el('p', { cls: 'mock-line' }, [
        el('span', { fg: 'text', text: 'See ' }),
        el('span', { fg: 'mdLink', text: 'the contract' }),
        el('span', { fg: 'mdLinkUrl', text: ' (docs/contract.md)' }),
        el('span', { fg: 'text', text: ' and ' }),
        el('span', { fg: 'mdCode', text: 'terminal.json' }),
      ]),
      el('div', { cls: 'mock-quote', fg: 'mdQuote', border: 'mdQuoteBorder', text: 'Slots, not hex.' }),
      el('p', { cls: 'mock-line' }, [
        el('span', { fg: 'mdListBullet', text: '• ' }),
        el('span', { fg: 'text', text: 'palette-only wins' }),
      ]),
      el('div', { cls: 'mock-hr', bg: 'mdHr' }),
    ]),

    el('div', { cls: 'mock-code', border: 'mdCodeBlockBorder' }, [
      el('div', {}, [
        el('span', { fg: 'syntaxComment', text: '// resolve a slot  ' }),
      ]),
      el('div', {}, [
        el('span', { fg: 'syntaxKeyword', text: 'const ' }),
        el('span', { fg: 'syntaxVariable', text: 'color ' }),
        el('span', { fg: 'syntaxOperator', text: '= ' }),
        el('span', { fg: 'syntaxFunction', text: 'slot' }),
        el('span', { fg: 'syntaxPunctuation', text: '(' }),
        el('span', { fg: 'syntaxNumber', text: '8' }),
        el('span', { fg: 'syntaxPunctuation', text: ')' }),
      ]),
      el('div', {}, [
        el('span', { fg: 'syntaxType', text: 'Slot ' }),
        el('span', { fg: 'syntaxString', text: '"gray"' }),
      ]),
    ]),

    el('div', { cls: 'mock-status', border: 'border' }, [
      el('span', { fg: 'accent', text: 'π terminal ' }),
      el('span', { fg: 'muted', text: 'muted ' }),
      el('span', { fg: 'dim', text: 'dim ' }),
      el('span', { cls: 'mock-selected', bg: 'selectedBg', fg: 'text', text: ' selected line ' }),
      el('span', { fg: 'bashMode', text: ' !bash' }),
    ]),
  ]);
}
