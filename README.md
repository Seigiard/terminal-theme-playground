# terminal-theme-playground

A static browser playground for designing palette-only TUI themes: see how
Claude Code, opencode, and pi render under any 16-color terminal ANSI palette,
edit token-to-slot assignments with live feedback, and copy the theme back in
each tool's exact native JSON dialect.

Status: under construction — U1 (scaffold + vendored seed data) landed;
resolvers, editor, previews, export, and deploy follow.

## Why

TUI themes under a palette-only contract reference terminal ANSI slots, never
baked hex — so every tool follows the terminal scheme automatically. But
nothing shows what a theme *looks like* under a given palette; picking a slot
for a token is blind guessing. (On the Alabaster palette, slots 7 and 15 equal
the background — text assigned there silently disappears.) This playground is
the eyes; syntactic contract tests in the theme's home repo stay the
enforcement.

## Development

No build, no dependencies. Plain ES modules and JSON.

```bash
node --test               # unit tests
python3 -m http.server    # serve locally, open http://localhost:8000
```

Vendored data provenance and the refresh procedure: `data/SOURCES.md`.

## License

MIT — see `LICENSE`. Vendored data and ported techniques derive from
MIT-licensed projects credited in `data/SOURCES.md`.
