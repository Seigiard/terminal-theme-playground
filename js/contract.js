// Palette-only contract checker: rules as data, one evaluator (KTD8).
// The pi and claude rules mirror the bats assertions in my-mac-setup
// tests/scripts.bats ("Pi terminal theme uses only terminal palette colors",
// "Claude Code daltonized theme extends light ANSI with terminal colors").
// The pi name pin (.name == "terminal") is seed metadata preserved by export,
// not a live-checked rule. Both the token-editor flags and the export warning
// consume this checker, so a rule exists in exactly one place.

const isSlotIndex = (v) => Number.isInteger(v) && v >= 0 && v <= 15;

const RULES = {
  pi: [
    {
      id: 'pi-vars-slot-index',
      description: 'every vars value is an ANSI palette index 0-15',
      check(doc) {
        return Object.entries(doc.vars ?? {})
          .filter(([, value]) => !isSlotIndex(value))
          .map(([token, value]) => ({
            token,
            message: `vars.${token} must be an integer 0-15, got ${JSON.stringify(value)}`,
          }));
      },
    },
    {
      id: 'pi-colors-no-hex',
      description: 'no colors value is a baked hex color',
      check(doc) {
        return Object.entries(doc.colors ?? {})
          .filter(([, value]) => typeof value === 'string' && value.startsWith('#'))
          .map(([token, value]) => ({
            token,
            message: `colors.${token} bakes hex ${value}; reference a var or use ""`,
          }));
      },
    },
    {
      id: 'pi-terminal-default-text',
      description: 'colors.text and colors.userMessageBg stay "" (terminal default)',
      check(doc) {
        return ['text', 'userMessageBg']
          .filter((token) => (doc.colors ?? {})[token] !== '')
          .map((token) => ({
            token,
            message: `colors.${token} must stay "" so the terminal default shows through`,
          }));
      },
    },
  ],
  claude: [
    {
      id: 'claude-ansi-base',
      description: 'base is an ANSI base (light-ansi or dark-ansi)',
      check(doc) {
        if (doc.base === 'light-ansi' || doc.base === 'dark-ansi') return [];
        return [{
          token: 'base',
          message: `base "${doc.base}" bakes hex values; use light-ansi or dark-ansi`,
        }];
      },
    },
    {
      id: 'claude-overrides-ansi',
      description: 'every override is an ansi:<name> slot reference',
      check(doc) {
        return Object.entries(doc.overrides ?? {})
          .filter(([, value]) => typeof value !== 'string' || !value.startsWith('ansi:'))
          .map(([token, value]) => ({
            token,
            message: `overrides.${token} must start with ansi:, got ${JSON.stringify(value)}`,
          }));
      },
    },
  ],
  opencode: [
    {
      id: 'opencode-palette-values',
      description: 'theme values are palette slots 0-15, token refs, or none/transparent',
      check(doc) {
        const theme = doc.theme ?? {};
        const defs = doc.defs ?? {};
        const violatesLeaf = (value) => {
          if (Number.isInteger(value)) return !isSlotIndex(value);
          if (typeof value === 'string') {
            if (value === 'none' || value === 'transparent') return false;
            if (value.startsWith('#')) return true;
            return false; // reference; hex-in-defs is caught by the defs rule below
          }
          if (value && typeof value === 'object') {
            return violatesLeaf(value.dark) || violatesLeaf(value.light);
          }
          return true;
        };
        return Object.entries(theme)
          .filter(([token, value]) => token !== 'thinkingOpacity' && violatesLeaf(value))
          .map(([token, value]) => ({
            token,
            message: `theme.${token} must be a palette slot 0-15, a reference, or none/transparent, got ${JSON.stringify(value)}`,
          }))
          .concat(
            Object.entries(defs)
              .filter(([, value]) => typeof value === 'string' && value.startsWith('#'))
              .map(([token, value]) => ({
                token,
                message: `defs.${token} bakes hex ${value}`,
              })),
          );
      },
    },
  ],
};

// Returns [{ token, ruleId, message }] — empty when the doc honors the contract.
export function checkContract(tool, doc) {
  const rules = RULES[tool];
  if (!rules) throw new Error(`unknown tool "${tool}"`);
  return rules.flatMap((rule) =>
    rule.check(doc).map((violation) => ({ ...violation, ruleId: rule.id })),
  );
}
