# Branching & Commit Convention

> `main` is always deployable.

## Branches
- **`main`** — protected. NO direct commits/pushes. All changes land via a **Merge/Pull Request (MR/PR)**.
- Short-lived working branches, created from `main`, named `<type>/<short-kebab-description>`:

| Prefix | Use for | Task type (router) |
|--------|---------|--------------------|
| `feat/` | new feature | #7 |
| `fix/` | bug fix | #3 |
| `change/` | change existing feature logic | #5 |
| `refactor/` | cleanup, no behavior change | #6 |
| `chore/` | build, deps, config | #2 |
| `docs/` | docs only | #2 |
| `hotfix/` | urgent prod patch (off `main`) | #4 |
| `spike/` | research/POC (throwaway, code not merged) | #8 |
| `design/` | UI/UX design or redesign | #9 |

Examples: `feat/user-login`, `fix/null-cart-total`, `change/discount-rounding`, `design/dashboard-refresh`.

## Merge/Pull Request
- **At least 1 reviewer** approval required before merge.
- Must meet the [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) of its path (CI green).
- **Squash merge** into `main` for a clean history (1 branch = 1 meaningful commit).
- Delete the branch after merge.
- The MR description states **what + why**, links PRD/TDD for Standard/Full.

## Commits — Conventional Commits
Format: `<type>(<scope>): <description>` — type matches the branch prefix: `feat` `fix` `refactor` `chore` `docs` `test` `perf` `design`.

```
feat(auth): add email login
fix(cart): handle null total when cart is empty
```

- BREAKING CHANGE: add `!` after the type (`feat!:`) or a `BREAKING CHANGE:` footer.
- Do NOT use `--no-verify` / `--no-gpg-sign` unless the user explicitly asks (the hook will block it).

## Hotfix & backport
1. Create `hotfix/<...>` from `main`.
2. Minimal patch + a reproducing test → fast MR (still reviewed) → merge into `main`.
3. **Backport**: cherry-pick/merge the change into the open development branch so it isn't lost when that branch merges later.
4. Log the incident for a post-mortem (Phase 5 retro).
