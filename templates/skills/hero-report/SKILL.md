---
name: hero-report
description: Use after hero-coding, hero-reviewing, or hero-unit-test finish work when the user asks for a written report — writes the artifact at the source skill's conventional path, on request only
---

# Hero Report

## Overview

hero-report is the on-demand report writer for the hero-* workflow. `hero-coding`, `hero-reviewing`, and `hero-unit-test` do the actual work and end with a concise chat summary — they do not write a report file by default. Invoke `hero-report` only when a written record is actually wanted. It writes using the path convention and content contract documented in the source skill's own "Report Convention" section, so that convention has one home instead of being duplicated across skills.

## When to Use

- The user explicitly asks for a report, or for the work to be written down.
- The change is Standard-or-larger and a durable artifact would matter for handoff, audit, or review — flag this to the user and let them decide rather than writing unasked.
- `hero-strict` needs to append a verification section to a report that doesn't exist yet.
- A completed `hero-security` report needs a link from another report for traceability.

Skip it for Tiny/Fast work where a chat summary is enough and nobody asked for a file.

## Inputs

- Which stage just completed: `hero-coding`, `hero-reviewing`, or `hero-unit-test` (default to the most recently completed one unless the user names another).
- That stage's own "Report Convention" section in its SKILL.md — path pattern, required content, and style rules. This skill does not redefine them; it reads them from the source skill.
- What actually happened in this session: the real evidence (commands run, output, diffs, findings, decisions) — not a reconstruction or a guess.

## Process

1. Identify the stage (or stages) to report on.
2. Read that stage's SKILL.md "Report Convention" section for the path pattern, required content, and style.
3. Compose the report strictly from what happened in this session. Don't re-run work just to fill a template field, and don't fabricate evidence that wasn't actually collected.
4. Write the file at the conventional path (create parent directories as needed).
5. If `docs/ACTIVE_STATE.md` has a row for this work item, add a one-line link to the new report.
6. If asked to report on multiple stages, write one file per stage — never merge coding/review/test reports into a single file.
7. If invoked after `hero-security`, do not recreate or replace the security report; link to the standalone `docs/security-reports/...` artifact from the relevant coding/review/test report when traceability is needed.

## Definition of Done

- The report is saved at the path convention defined by the source stage's SKILL.md.
- Content matches that stage's required fields — nothing invented, nothing dropped.
- `docs/ACTIVE_STATE.md` links to the new report if a row exists for this item.

## Related Skills

- Reads the artifact convention from `hero-coding`, `hero-reviewing`, or `hero-unit-test` — does not duplicate it.
- May link to `hero-security`'s standalone `docs/security-reports/...` artifact from another report when traceability is useful.
