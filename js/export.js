// Native-dialect serialization for export (R18). Structure preservation is
// the contract: pi keeps its $schema/name/vars/colors shape (an untouched
// seed byte-matches the vendored file), claude emits the minimal
// {name, base, overrides} diff, opencode emits {defs?, theme}.

const stringify = (doc) => JSON.stringify(doc, null, 2) + '\n';

const SERIALIZERS = {
  pi: (doc) => stringify(doc),
  claude: (doc) => stringify({ name: doc.name, base: doc.base, overrides: doc.overrides }),
  opencode: (doc) => {
    const out = {};
    if (doc.$schema) out.$schema = doc.$schema;
    if (doc.defs && Object.keys(doc.defs).length > 0) out.defs = doc.defs;
    out.theme = doc.theme;
    return stringify(out);
  },
};

export function serializeTheme(tool, doc) {
  const serialize = SERIALIZERS[tool];
  if (!serialize) throw new Error(`unknown tool "${tool}"`);
  return serialize(doc);
}
