---
name: hero-gitflow
description: Use when the user explicitly requests Git branch creation or delivery operations — checks protected branches, preserves .gitignore, and follows ticket-based branch and commit conventions without automating the next step
---

# Hero Gitflow

## Overview

A standalone, human-led Git workflow. Use it only for a Git action the user has specifically requested; installing this skill does not authorize branch creation, commit, push, merge, revert, or rebase. Completing one action never authorizes another. It does not run automatically after `hero-coding`, testing, or review, and it does not replace the repository's Git hooks.

## When to Use

Use when the user asks to create a branch, commit changes, push a branch, merge, revert, or rebase. For a read-only review of a teammate's committed MR, use `hero-mr-review` instead. If the request only asks for implementation, testing, or review, do not perform Git delivery.

## Inputs

- The exact Git action requested; for push/merge/rebase/revert, the user must name that action specifically. Do not treat "finish", "ship", or approval of a previous step as permission for a different action.
- For a new branch: its type (`feature`, `fix`, or `hotfix`), a short description, any ticket code supplied by the user, and the intended base if more than one eligible base exists. Never invent a ticket code.
- For merge/rebase/push: the source and destination refs or remote. Ask when the destination cannot be established safely.
- For a commit: which changes are in scope. Ask before including unrelated changes.

## Process

1. **Read-only preflight.** Check `git status --short`, `git branch --show-current`, the relevant source/destination refs, and `git diff --cached --name-only` before changing Git state. Check both staged and unstaged changes, including `.gitignore`; inspection is allowed, modification is not. Confirm the requested operation and where its result will land. If the working tree is dirty and a checkout or worktree operation may carry or disturb local changes (especially `.gitignore`), stop and ask rather than moving, stashing, or cleaning them.
2. **Enforce protected destinations.** `develop`, `release/*`, `main`, and `master` are protected branches. Never commit while on them, or push, merge, rebase, or revert *into* them, even if requested. This applies to local and remote destinations (including refspecs). Explain the block and ask for a permitted destination; do not silently switch branches. Creating a new branch *from* an eligible protected base is allowed only when branch creation was requested.
3. **Create a branch only on request.** `feature/*` and `fix/*` must start from `develop` or `release/*`; `hotfix/*` must start from `main` or `master`. If the required base is absent or multiple bases are plausible, ask instead of guessing or fetching/switching implicitly. Keep a supplied ticket code and a short kebab-case description in the name, e.g. `feature/BU-1740-short-description` or `fix/CI-1545-short-description`. Without a ticket, use `feature/short-description` or `fix/short-description`; do not fabricate one. Check the proposed branch name and base before creating it.
4. **Commit only on an eligible branch and on request.** Never touch `.gitignore`: do not edit, stage, unstage, restore, stash, clean, or include it in a commit, even when it has local unstaged changes. If it is already staged, stop and ask the user to handle it; do not alter the index entry yourself. Stage only explicitly approved paths (never `git add .`, `git add -A`, or `git commit -a`). Inspect `git diff --cached --name-only` and `git diff --cached` before committing; stop if `.gitignore` or changes outside the approved scope are staged. Write an English message with a short descriptive title, prefixed by the ticket code when supplied, followed by detailed bullet points. Example:

   ```text
   BU-1740: Add account search filters

   - Add filters for account status and owner.
   - Keep existing search results unchanged when no filter is selected.
   ```

   Do not add an agent/actor signature, `Signed-off-by`, `Co-Authored-By`, or generated-by trailer, and do not set an agent identity as the author. Use the human-configured Git identity; if it is missing or points to an agent, pause for the user to configure it. Do not bypass hooks.
5. **Other operations require their own explicit request.** Push only to a permitted destination; inspect the remote and refspec first. Merge, rebase, or revert only onto a permitted branch and only for the exact refs/commits the user requested. Never chain these operations after a commit or branch creation. Do not force-push or use destructive reset/cleanup as a workaround. If a conflict involves incompatible logic between branches and the right behavior cannot be determined from the requirements, stop, describe the alternatives, and ask the user before resolving it. Preserve unresolved work without guessing.
6. **Report the result.** State the action actually taken, source/destination or commit identifier when available, any untouched `.gitignore` changes, and any blocked or pending action. Never imply that a commit was pushed or merged when it was not.

## Output Style

- Lead with the action and result, then the branch/commit evidence and any next decision.
- Preserve exact branch names, ticket codes, file paths, commands, and error strings.
- Explain protected-branch blocks and ambiguous conflicts clearly; do not present a guess as a resolution.

## Definition of Done

- The action was specifically requested and passed the preflight and protected-destination checks.
- `.gitignore` was not modified, staged, unstaged, restored, or committed by this workflow; no unrelated changes were included.
- Any commit uses the English title-and-bullets format, with the supplied ticket prefix if present and no agent/actor signature.
- Logical conflicts that cannot be decided from the requirements were left for the user to decide.
- The actual outcome and remaining manual decisions were reported without implying a later Git action happened.

## ACTIVE_STATE.md Update

Do not create or rewrite workflow artifacts just to record a Git action. If an existing Active Features row needs its branch reference or status updated and the user requested that state update, follow the `docs/ACTIVE_STATE.md` convention without changing unrelated rows.

## Related Skills

`using-hero` routes to this skill for a user-requested Git action. `hero-coding`, `hero-unit-test`, and review skills keep their separate boundaries and do not invoke Git delivery automatically. Generic vendored skills such as `using-git-worktrees`, `brainstorming`, or `subagent-driven-development` cannot override these Git constraints or authorize a commit. `git-guard` blocks only a narrower set of commands; its silence is not permission to violate this skill.
