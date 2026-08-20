// Claude Code mock: brief labels, user message, tool/permission surfaces,
// diff, modes, prompt input. Structure ported from claude-theme-builder's
// preview (MIT); token hints in data/tokens/claude.js name each surface.

import { el } from './common.js';

export function buildClaudeMock() {
  return el('div', { cls: 'mock-terminal' }, [
    el('p', { cls: 'mock-line' }, [
      el('span', { fg: 'claude', text: '✻ ' }),
      el('span', { fg: 'text', text: 'Welcome back. ' }),
      el('span', { fg: 'claudeBlue_FOR_SYSTEM_SPINNER', text: '⠋ thinking… ' }),
      el('span', { fg: 'inactive', text: '(esc to interrupt)' }),
    ]),

    el('div', { cls: 'mock-msg', bg: 'userMessageBackground' }, [
      el('span', { fg: 'briefLabelYou', text: 'You: ' }),
      el('span', { fg: 'text', text: 'fix the muted text contrast' }),
    ]),
    el('p', { cls: 'mock-line' }, [
      el('span', { fg: 'briefLabelClaude', text: 'Claude: ' }),
      el('span', { fg: 'text', text: 'Reading the theme file now. ' }),
      el('span', { fg: 'subtle', text: 'subtle detail' }),
    ]),

    el('div', { cls: 'mock-tool', border: 'success' }, [
      el('span', { fg: 'success', text: '✓ ' }),
      el('span', { fg: 'text', text: 'Edit(theme.json) ' }),
      el('span', { fg: 'inactive', text: '2 lines changed' }),
    ]),
    el('div', { cls: 'mock-tool', border: 'error' }, [
      el('span', { fg: 'error', text: '✗ ' }),
      el('span', { fg: 'text', text: 'bats tests ' }),
      el('span', { fg: 'warning', text: '1 warning' }),
    ]),

    el('div', { cls: 'mock-diff', border: 'promptBorder' }, [
      el('div', { bg: 'diffRemoved' }, [
        el('span', { fg: 'text', text: '-  "mutedText": ' }),
        el('span', { bg: 'diffRemovedWord', fg: 'inverseText', text: '"#6F6E69"' }),
      ]),
      el('div', { bg: 'diffAdded' }, [
        el('span', { fg: 'text', text: '+  "mutedText": ' }),
        el('span', { bg: 'diffAddedWord', fg: 'inverseText', text: '8' }),
      ]),
      el('div', { bg: 'diffAddedDimmed' }, [
        el('span', { fg: 'inactive', text: '+  (collapsed 3 lines)' }),
      ]),
    ]),

    el('div', { cls: 'mock-perm', border: 'permission' }, [
      el('span', { fg: 'permission', text: 'Permission: ' }),
      el('span', { fg: 'text', text: 'run bats tests? ' }),
      el('span', { cls: 'mock-selected', bg: 'selectionBg', fg: 'text', text: ' 1. Yes ' }),
      el('span', { fg: 'suggestion', text: ' 2. Always' }),
    ]),

    el('p', { cls: 'mock-line' }, [
      el('span', { fg: 'planMode', text: '⏸ plan mode ' }),
      el('span', { fg: 'autoAccept', text: '⏵ auto-accept ' }),
      el('span', { fg: 'fastMode', text: '» fast ' }),
      el('span', { fg: 'skill', text: '/skill ' }),
      el('span', { fg: 'remember', text: '# memory ' }),
      el('span', { fg: 'ide', text: '⌥ IDE' }),
    ]),

    el('div', { cls: 'mock-rate' }, [
      el('span', { cls: 'mock-rate-fill', bg: 'rate_limit_fill', text: ' ' }),
      el('span', { cls: 'mock-rate-empty', bg: 'rate_limit_empty', text: ' ' }),
      el('span', { fg: 'inactive', text: ' rate limit' }),
    ]),

    el('div', { cls: 'mock-prompt', border: 'promptBorder' }, [
      el('span', { fg: 'text', text: '> ' }),
      el('span', { fg: 'suggestion', text: 'try "bats tests/…"' }),
    ]),
    el('div', { cls: 'mock-prompt', border: 'bashBorder', bg: 'bashMessageBackgroundColor' }, [
      el('span', { fg: 'text', text: '! git status' }),
    ]),
  ]);
}
