# terminal-theme-playground — agent notes

What the tool is, how to run and test it: `README.md`. Data provenance and the
refresh procedure: `data/SOURCES.md`. This file carries only what you cannot
find by looking at the repo.

## Cross-repo coupling (not visible from this checkout)

- This repo is the **eyes** of a palette-only theme contract whose
  **enforcement** lives in another repo: `my-mac-setup` (`tests/scripts.bats`,
  the pi/Claude theme assertions). `js/contract.js` mirrors those rules; when
  they change there, the checker here must follow — nothing automates that.
- The implementation plan, design decisions, and follow-up issues live in
  `my-mac-setup` too: `docs/plans/2026-08-20-1854-feat-terminal-theme-playground-plan.md`
  and `docs/issues/2026-08-20-011-opencode-bare-int-hardcoded-table.md`
  (locally `~/Projects/my-mac-setup`). File new follow-ups there, not here.
- Vendored files under `data/` are pinned to `my-mac-setup@39ea84c` and to the
  upstream versions named in `data/SOURCES.md`. Refresh them only from those
  sources, manually, whole-file.

## Traps a repo scan will not show

- `data/seeds/*.json` must stay **byte-exact**: `tests/export.test.js` asserts
  the untouched pi seed byte-matches its file (2-space indent, source key
  order, trailing newline). Running a formatter over `data/` breaks the suite.
- Zero dependencies is a settled decision, not an omission: plain ES modules,
  no bundler, `node --test` only. Adding a package or build step reverses a
  user-approved decision — surface it instead.
- Run tests as `node --test` from the repo root. The form `node --test tests/`
  fails on current Node (directory arg resolves as a module).
- The stored-state key `terminal-theme-playground/v1` is schema-versioned:
  changing the persisted state shape means bumping the suffix, or every
  visitor's stored state gets silently dropped by load-time validation.

## Deploy (settings live outside the repo)

- Every push to `main` deploys to **production**: GitHub Pages, workflow
  source, served at https://seigiard.com/terminal-theme-playground/ (custom
  domain on the Seigiard account — not github.io). There is no staging; the
  test job in `.github/workflows/deploy.yml` is the only gate.
- Commits go directly to `main`; this repo has no PR flow.
