# Phase Handoff Protocol v4 — Context-Safe Workflow Boundaries

## Purpose

This protocol prevents long AI coding sessions from turning chat history into the primary state store.

It is designed for workflows such as:

```text
BA / Discovery → Design / Architecture → Code → Test → Verify / QA → Handover
```

At each real phase boundary, the current phase writes a bounded handoff artifact. The next phase starts from a short prompt and reads the artifact first, not the old chat transcript.

The protocol directly addresses failures such as:

```text
API Error: 400 Your input exceeds the context window of this model.
```

---

## Operational summary

For day-to-day agent use, the core rules are:

1. Choose the smallest workflow mode that fits the task.
2. At a real phase boundary, create a bounded handoff artifact.
3. Keep `resume.md` as a short pointer, not a duplicate summary.
4. Start the next phase artifact-first, not chat-first.
5. Run a minimal sanity check before trusting the artifact.
6. Store raw logs/diffs/reviews in supporting artifacts, not chat or handoff bodies.
7. Use fresh evidence for claims about changed code, tests, or QA.
8. If context pressure is medium/high, compact or start a fresh session before the next phase.
9. Do not claim completion without the required Definition of Done and final verification statement.

The full protocol below is reference material. Project workflow docs should expose a shorter operational checklist and link here for details. Do not copy this full protocol into multiple always-loaded docs; that would turn the context-management protocol into context bloat.

---

## Core principle

```text
Phase work → Bounded handoff artifact → Context reset boundary → Next phase reads artifact-first
```

A handoff is not just a summary. It is the contract between phases.

The contract must be:

- short enough to fit safely in context,
- specific enough for the next phase to start without reading old chat,
- backed by fresh evidence paths for important claims,
- explicit about what to read and what not to read,
- clear about approval state and source-of-truth priority,
- updated, superseded, or marked stale when requirements or code change.

Fresh evidence means the evidence was produced after the relevant change, on the expected branch and working tree.

---

## Critical constraint

Writing a `.md` handoff file does **not** reduce context by itself.

It only helps when followed by a real context boundary:

1. `/compact` in the current session,
2. a fresh session,
3. a bounded sub-agent handoff,
4. a workflow boundary where only the artifact is passed forward.

If the same bloated session continues after writing the handoff, old `Messages` remain in context and may still exceed the model window.

---

## Tool adaptation

This protocol is tool-agnostic. Claude Code-specific mechanisms include `/compact`, `/context`, sub-agents, and slash-command skills.

When a tool lacks `/compact` or `/context`, use the closest equivalent:

- fresh session,
- new agent task,
- summarized artifact boundary,
- manual context reset,
- project-local workflow checkpoint.

Tool-specific commands and thresholds belong in project-local workflow docs. The invariant is artifact-first continuation, not a specific CLI command.

---

## Artifact-first does not mean artifact-only

The next phase should start from `resume.md` and the latest canonical handoff, but it must still run a minimal sanity check against the current repository state.

The goal is to avoid broad rediscovery, not to trust stale artifacts blindly.

---

## Workflow modes

Do not force the full five-phase ceremony on every task.

Choose the smallest mode that satisfies risk, scope, and Definition of Done.

| Mode | Use when | Typical phases | Handoff requirement |
|---|---|---|---|
| Tiny | Typo, text tweak, trivial config, clearly local change | Code → Verify → Handover | Optional; create one only if context pressure appears |
| Small | Localized change or bugfix with clear scope | Design-lite → Code → Test/Handover | One compact handoff before verification if needed |
| Standard | Existing behavior change, refactor, multi-file change, meaningful bugfix | Discovery-lite → Design → Code → Test → QA → Handover | Required at Code → Test and Test → QA; earlier handoffs when planning is non-trivial |
| Full | New feature, broad change, high-risk work, UI/product/security-sensitive work | BA → Design/Architecture → Code → Test → QA/Security/Performance → Handover | Required at every phase boundary |

### Quick decision tree

Use this fast path before reading the full checklist:

```text
Does it change API, data model, security, auth, payment, permissions, or a major user workflow?
  → Full
Else does it affect existing workflow behavior, refactor shared code, or require meaningful tests/review?
  → Standard
Else is it localized behavior/config/docs work within <= 5 likely files and low risk?
  → Small
Else is it typo/text/trivial config within <= 2 likely files with obvious verification?
  → Tiny
Else
  → Standard by default
```

The checklist below overrides the quick tree when it identifies higher risk.

### Mode selection checklist

Choose **Tiny** only if all are true:

- likely changes are <= 2 files,
- no API/data contract change,
- no behavior change beyond local UI/text/config,
- no migration/security/payment/auth/permission impact,
- verification is obvious and cheap.

Choose **Small** when all are true:

- behavior change is localized,
- likely changes are <= 5 files,
- no cross-module dependency or shared contract change,
- rollback is simple,
- no sensitive surface is affected.

Choose **Standard** if any are true:

- multi-file behavior change,
- refactor,
- existing workflow affected,
- root cause is not fully certain,
- tests need meaningful design,
- impact analysis is required by project rules,
- QA/review gate is required.

Choose **Full** if any are true:

- new feature,
- architecture/API/data model change,
- security/payment/auth/permission impact,
- user-facing workflow changes materially,
- high cost of regression,
- cross-team or long-running work,
- UI/product design needs approval.

### Mode escalation

Escalate mode when:

- impact/risk increases,
- file count grows beyond initial scope,
- user requirements change materially,
- tests fail for unclear reasons after one fix loop,
- the task crosses from local edit into workflow/design/API behavior,
- context pressure becomes medium or high.

When mode escalates:

1. update `resume.md` current mode,
2. write `changes/MODE-ESCALATION-<slug>.md` or document the reason in the current handoff,
3. identify newly required handoffs/reviews,
4. mark skipped previous handoffs as `not applicable` or create them retroactively if needed,
5. do not continue until the next action contract matches the new mode.

### Mode de-escalation

De-escalate only when evidence shows the original risk/scope was overestimated.

Allowed examples:

- Standard → Small after impact analysis shows the change is local and no QA gate is required.
- Full → Standard after a requested new feature becomes a constrained modification to existing behavior.

When mode de-escalates:

1. update `resume.md` current mode,
2. record the reason in `changes/MODE-DEESCALATION-<slug>.md` or the current handoff,
3. mark no-longer-required handoffs/reviews as `not applicable`,
4. keep already-created evidence artifacts; do not delete them just because the mode changed,
5. do not skip any project-required gate that already applies to the changed files or risk surface.

---

## Real phase boundary

A real phase boundary occurs when at least one is true:

- the next step requires a different role or review mindset,
- the current phase produced a decision, implementation, or test result future work depends on,
- continuing without summarizing would require the next agent/session to rely on chat memory,
- user approval or QA gate is expected,
- context pressure trigger is reached,
- a sub-agent/workflow boundary is about to be crossed,
- the work is moving from planning to implementation or from implementation to verification.

Not a real phase boundary:

- switching between two small edits inside the same implementation step,
- rerunning a failed command after a trivial fix,
- reading one additional referenced file,
- updating a typo in the same artifact,
- making a local follow-up edit that does not change the phase contract.

Do not create handoffs just to create ceremony. Create them when they preserve correctness or context safety.

---

## Status, verdict, and severity model

### Workflow status

Use workflow status for overall phase progression:

- `green` — can proceed normally.
- `yellow` — can proceed with known risks, missing non-blocking evidence, or accepted gaps.
- `red` — should not proceed until fixed or explicitly accepted by the user/lead.

### QA verdict

Use QA verdict for review outcome:

- `pass` — accepted, no blocking finding.
- `yellow` — accepted with documented risks/gaps.
- `fail` — findings require fix before handover.
- `blocked` — QA cannot complete due to missing evidence, environment, approval, or required artifact.

### Severity

Use severity for risks, blockers, and findings:

- `critical` — must stop; cannot proceed without fix or explicit exception.
- `high` — must fix before handover unless explicitly accepted.
- `medium` — can proceed only with documented risk/owner/mitigation.
- `low` — note only; does not normally block.

Mapping:

- unresolved `critical` or unaccepted `high` → workflow status `red` or QA verdict `fail/blocked`,
- unresolved `medium` → workflow status `yellow` unless accepted as non-risk,
- only `low` unresolved → usually `green` or `yellow` depending on context.

Avoid ambiguous combinations. If `Status: green` and `QA verdict: yellow`, explain why QA gaps are non-blocking.

Operational distinction:

- Use `Approval: blocked` when the phase cannot proceed because approval or a user/lead decision is missing.
- Use `Status: red` when the work state is unsafe, incorrect, stale, or not ready to proceed.
- Use `QA verdict: blocked` when QA cannot evaluate due to missing evidence, environment, or access.
- Use `critical | high | medium | low` for individual risks, blockers, and findings.

---

## Canonical vs supporting artifacts

Canonical artifacts are the contract inputs for the next phase:

- `resume.md`,
- the latest handoff directly under `handoffs/`,
- approved change requests or amendments that affect the current phase.

Supporting artifacts are evidence or detail:

- `logs/`,
- `reviews/`,
- `decisions/`,
- `artifacts/`,
- `archive/`.

The next phase reads canonical artifacts first. It reads supporting artifacts only when the canonical artifact references them and the detail is needed.

---

## Recommended artifact layout

For each non-trivial work item, use this layout as needed:

```text
docs/reports/YYYY-MM-DD-<slug>/
  resume.md
  handoffs/
    01-ba-to-design.md
    02-design-to-code.md
    03-code-to-test.md
    04-test-to-qa.md
    05-qa-to-handover.md
  logs/
  reviews/
  decisions/
  changes/
  artifacts/
  archive/
```

Directory roles:

- `resume.md` — short pointer to latest state and next action.
- `handoffs/` — canonical phase contracts. One file per boundary.
- `logs/` — raw command output and long stack traces.
- `reviews/` — code review, security review, QA review, visual QA.
- `decisions/` — ADRs or important architecture/product decisions.
- `changes/` — user change requests, amendments, mode escalation/de-escalation notes.
- `artifacts/` — PRD, API contract, test matrix, design notes, generated reports.
- `archive/` — superseded handoff versions.

Do not create empty directories or placeholder artifacts unless the project convention requires them. Create supporting directories only when they are used.

Do not put full logs, full diffs, full files, secrets, sensitive data, or old transcripts in handoff files.

### Optional artifact index for Full mode

For Full mode or very long-running work, an optional lightweight index can help navigation:

```text
docs/reports/YYYY-MM-DD-<slug>/index.md
```

Use it only when `resume.md` would otherwise become too crowded.

Template:

```markdown
# Artifact Index — <Work Item>

## Canonical
- `resume.md`:
- `handoffs/<latest>.md`:
- `changes/<approved-cr>.md`:

## Supporting
- `logs/...`:
- `reviews/...`:
- `decisions/...`:
- `artifacts/...`:

## Archived
- `archive/...`:
```

Rules:

- Keep `index.md` lightweight.
- Do not duplicate handoff contents.
- Do not create it for Tiny/Small work unless the project convention requires it.

---

## Naming conventions

Report slug:

- lowercase-kebab-case,
- short and stable,
- task-specific,
- no long ticket titles; prefer 3–8 words.

Example:

```text
docs/reports/2026-06-07-checkout-flow/
```

Log file names:

```text
logs/YYYYMMDD-HHMM-<sanitized-command-name>.log
```

Examples:

```text
logs/20260607-1430-npm-test.log
logs/20260607-1445-git-diff-check.log
```

Rules:

- sanitize command names,
- avoid overwriting previous logs unless intentional,
- if overwriting is intentional, say so in the command summary,
- keep log path stable in evidence records.

---

## Artifact read and write budgets

Bounded means both the artifacts read and artifacts written are bounded.

### Read budget

Default next-phase read budget:

```text
Tiny/Small: resume.md + latest handoff + at most 2 referenced files
Standard:   resume.md + latest handoff + at most 5 referenced files/artifacts
Full:       resume.md + latest handoff + at most 8 referenced files/artifacts
```

Do not read all handoffs by default. Read the latest canonical handoff, then older handoffs only if the latest one explicitly requires it.

Read budget exception format:

```markdown
## Read budget exception
- Original budget:
- Additional files/artifacts needed:
- Reason:
- Narrowing strategy:
- Stop condition:
```

### Write budget

Default supporting artifact budget:

| Mode | Default write budget |
|---|---|
| Tiny | Avoid report folder unless needed; no empty dirs |
| Small | Max 1 handoff; logs only for noisy commands |
| Standard | Required handoffs + logs/reviews only when used |
| Full | Full structure allowed, but only create artifacts with content |

Do not create artifacts to look thorough. Create them when they preserve evidence, decisions, or context safety.

---

## Artifact size limits

Token targets take precedence. Line limits are density signals only.

If an artifact is under the line limit but likely over the token target because of dense JSON, code, stack traces, schemas, or long paragraphs, move dense content to a supporting artifact and keep the handoff short.

### Size targets

| Artifact | Target size |
|---|---:|
| `resume.md` | <= 1k tokens |
| Tiny handoff | <= 1.5k tokens |
| Small handoff | <= 2.5k tokens |
| `01-ba-to-design.md` | <= 4k tokens |
| `02-design-to-code.md` | <= 8k tokens |
| `03-code-to-test.md` | <= 5k tokens |
| `04-test-to-qa.md` | <= 4k tokens |
| `05-qa-to-handover.md` | <= 4k tokens |

Fallback line limits:

| Artifact | Max lines |
|---|---:|
| `resume.md` | 150 |
| Tiny handoff | 150 |
| Small handoff | 250 |
| BA→Design | 400 |
| Design→Code | 600 |
| Code→Test | 400 |
| Test→QA | 300 |
| QA→Handover | 300 |

Density rules:

- prefer short bullets,
- avoid paragraphs longer than 5 lines,
- avoid pasted JSON/code except tiny snippets,
- do not paste stack traces,
- if a section feels dense, move detail to a supporting artifact and link it.

Section limits:

- max 10 decisions,
- max 30 changed-file bullets,
- max 1–2 lines per changed file,
- max 10 command summaries,
- max 3–5 top errors per command,
- max 10 risks or blockers,
- max 10 file citations unless a review artifact holds the detailed list.

---

## Security and privacy hygiene

Do not include in handoffs:

- secrets, tokens, API keys,
- credentials,
- full environment variables,
- personal/customer data unless explicitly required and minimized,
- raw production logs with sensitive data,
- connection strings,
- private URLs unless project policy permits them,
- screenshots or media containing private data.

If evidence contains sensitive data:

- store a redacted summary,
- reference a secure location only if project policy permits,
- mark access requirements,
- do not paste sensitive evidence into chat.

---

## Source-of-truth priority

When sources conflict, use this priority order:

1. latest explicit user instruction that changes requirements or constraints,
2. latest approved handoff or approved amendment,
3. referenced source artifact: PRD, technical design, ADR, test matrix, API contract,
4. current code and command evidence,
5. older handoffs,
6. old chat history, only if explicitly allowed.

User instructions are not all the same:

- A requirement-changing instruction can supersede an approved handoff, but must be captured as a change request or handoff update before work continues.
- A process/style instruction affects how to execute, but does not automatically change the product/technical contract.
- A casual comment or clarification should not silently invalidate an approved artifact; convert it into an explicit change request if it changes scope.

If the conflict is material and unresolved, mark the handoff `blocked`.

---

## Approval states and approval evidence

Every handoff must declare approval status:

```text
Approval: draft | approved | auto-approved | blocked
Approved by:
Approval evidence:
Approval note:
```

Meanings:

- `draft` — written by the agent, not yet a stable contract.
- `approved` — explicitly approved by user/lead or accepted through a gate.
- `auto-approved` — acceptable for Tiny/Small work where no gate is required.
- `blocked` — cannot be used for the next phase until a question or issue is resolved.

Rules:

- `approved` requires evidence: user message, Plan Mode gate result, PR/MR approval, or a referenced decision artifact.
- `auto-approved` can be set by the agent only when the selected mode permits it and no user decision is pending.
- `Approved by: user` is not valid without `Approval evidence`.
- If approval cannot be verified, use `draft` or `blocked`, not `approved`.

Examples:

```text
Approval evidence: User message "Approved, proceed with implementation" on 2026-06-07
Approval evidence: Plan Mode approval for docs/plans/checkout-flow.md
Approval evidence: PR #123 approved by <name>
Approval evidence: decisions/ADR-002.md
```

---

## Handoff templates

The base handoff template and all five phase-specific templates (BA/Discovery → Design/Architecture, Design/Architecture → Code, Code → Test, Test → Verify/QA, Verify/QA → Handover) are defined once, canonically, in [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) §1 and §1.2. Use that document when creating or updating any handoff artifact.

When filling in `Status`, `Verdict`, or severity fields, use the vocabulary defined above in this document (§ Status, verdict, and severity model): workflow status `green | yellow | red`, QA verdict `pass | yellow | fail | blocked`, severity `critical | high | medium | low`.

Standard evidence identity format:

```text
Evidence captured against: branch <name>, commit <hash|none>, working tree <clean|dirty>, diff summary <path|none>, captured at <YYYY-MM-DD HH:MM local>
```

---

## Resume file template

`resume.md` is the fresh-session entry point. It points; it does not narrate everything.

```markdown
# Resume Packet — <Work Item>

## Current pointer
- Latest canonical handoff:
- Current mode:
- Current phase:
- Next action:

## State
- Status: green | yellow | red
- Branch:
- Working tree state:
- Key artifacts:
- Changed files summary:

## Verification
- Last command:
- Result:
- Log path:
- Evidence freshness:

## Open items
- Blockers:
- Risks:
- User decisions needed:

## Context rules for next session
- Read first:
- Read only if needed:
- Do not reread:
- Do not paste:
```

Rules:

- Keep `resume.md` under the target size.
- Do not duplicate every handoff.
- Update it whenever the canonical handoff changes.
- If `resume.md` and the latest approved handoff conflict, fix `resume.md` before continuing.

---

## Non-code work

If no code changed, replace code-oriented evidence with artifact-oriented evidence.

Examples of non-code work:

- PRD/spec review,
- architecture review,
- documentation update,
- prompt/workflow design,
- planning artifact creation,
- research report.

Rules:

- replace `git diff` evidence with artifact diff or document change summary when appropriate,
- build/test commands may be `not applicable`,
- verification can be review, lint, link check, markdown check, or user approval,
- final claims must still state what was and was not verified,
- use mode DoD, but mark code-specific checks as `not applicable` with reason.

---

## Change requests and amendments

When the user changes requirements mid-work, create a change artifact:

```text
changes/CR-001-<slug>.md
```

Template:

```markdown
# Change Request CR-001 — <Title>

## Source
- User instruction:
- Date/session:

## Change
- Previous requirement/contract:
- New requirement/contract:

## Impact
- Affected phases:
- Affected files/contracts:
- Required rework:
- Tests/reviews to repeat:

## Handoff update
- Canonical handoff to update:
- Archive created:
- Approval required: yes | no
```

Rules:

- If the change affects a contract, update the canonical handoff.
- If the change invalidates prior design/code/test work, mark affected phases in `resume.md`.
- Do not continue with a stale handoff after a material change.

---

## Versioning, archive, and garbage collection

Avoid `final-final-v3.md` naming.

Canonical files stay stable:

```text
handoffs/02-design-to-code.md
```

Superseded versions go to archive:

```text
archive/02-design-to-code.v1.md
archive/02-design-to-code.v2.md
```

When updating a canonical handoff:

1. copy the old canonical version to `archive/`,
2. update the canonical file in `handoffs/`,
3. update `resume.md`,
4. create or update a `changes/CR-*.md` artifact when the reason is a requirement or contract change,
5. mark downstream phase artifacts stale when the update invalidates them.

Do not silently edit an already-used canonical handoff. If a later phase has consumed it, a material update requires archive + change note + downstream stale marking.

Garbage collection defaults:

- keep the latest 3 archived versions per canonical handoff,
- keep archive versions referenced by a CR, PR, release note, or incident permanently unless manually removed,
- delete only with explicit user/project permission,
- if cleanup is needed, write a cleanup summary before deleting.

The latest canonical handoff is always the file directly under `handoffs/`.

---

## Concurrency rule

When multiple agents or workflows may write artifacts:

Before writing canonical artifacts:

- check the current `resume.md` latest pointer,
- check whether the canonical handoff changed since it was read,
- avoid parallel writes to the same canonical file,
- write supporting artifacts first, then update canonical handoff, then update `resume.md`,
- if conflict occurs, write a conflict note under `changes/` and stop for reconciliation.

Never let two agents independently update `resume.md` or the same canonical handoff without reconciliation.

---

## Stale handoff detection

A handoff is stale if any are true:

- user changed requirements after its `Last updated` time,
- git diff changed after a Code → Test handoff was written,
- test results are older than the latest relevant code/config/artifact change,
- `resume.md` points to a different canonical handoff,
- a CR artifact says this handoff must be updated,
- branch changed since the handoff was created,
- working tree state no longer matches `Evidence captured against`,
- an approval gate was revoked or superseded.

If stale:

1. stop phase transition,
2. update or archive the handoff,
3. update `resume.md`,
4. rerun affected evidence if needed,
5. only then continue.

---

## Evidence freshness

Evidence is valid only if:

- it was produced after the relevant code/config/artifact change,
- the command ran on the expected branch,
- the command ran against the expected working tree or commit,
- the log path is referenced,
- skipped commands include reason and risk,
- downstream changes did not invalidate it.

If evidence is old but still useful, label it as historical, not current verification.

---

## Evidence and artifact drift prevention

Do not let handoffs drift away from code reality.

Important claims need fresh evidence paths.

Bad:

```markdown
Tests passed.
```

Good:

```markdown
- Command: npm test
- Result: passed
- Exit code: 0
- Log path: docs/reports/<slug>/logs/20260607-1430-npm-test.log
- Evidence captured against: branch feature/checkout-flow, commit none, working tree dirty, diff summary docs/reports/<slug>/logs/20260607-1425-git-diff-name-status.log, captured at 2026-06-07 14:30 local
```

Before writing Code → Test, Test → QA, or QA → Handover handoffs, capture or explicitly mark the status of:

- current branch,
- `git status`,
- `git diff --name-status`,
- `git diff --stat`,
- `git diff --check`,
- relevant build/test commands,
- project-required impact/change analysis when code changed.

If a command is not run, write:

```markdown
Not run:
- Command:
- Reason:
- Risk:
- Severity:
```

Do not let the agent rely on memory for changed files, test status, or QA verdict.

---

## Minimum sanity check for the next phase

Artifact-first does not mean trusting artifacts blindly.

At the start of Code, Test, QA, or Handover, verify minimally:

- current branch is expected,
- `git status` is understood,
- latest canonical handoff is not superseded,
- required files exist,
- changed files summary matches the handoff,
- relevant package/build/test commands exist when needed,
- open blockers are not marked as resolved without evidence.

### Sanity check output format

```markdown
## Sanity check
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note

Decision: continue | continue-with-warning | stop
```

Hard blockers:

- wrong branch for the task,
- latest canonical handoff is stale or superseded,
- required file missing,
- user approval required but absent,
- evidence claimed as current but older than relevant code changes,
- unresolved blocker marked as complete without evidence.

Warnings:

- optional command unavailable,
- non-critical supporting artifact missing,
- manual verification required but not yet run,
- minor mismatch that does not affect the next step.

Do not read the broad repository unless the sanity check reveals a mismatch that requires broader investigation.

---

## Proactive context planning

Do not wait until context is bloated.

Before starting a phase, estimate context risk:

```markdown
## Context plan
- Phase:
- Expected files/artifacts to read:
- Expected commands:
- Expected sub-agents:
- Risk: low | medium | high
- Boundary plan: continue | compact first | fresh session | sub-agent boundary
```

### Boundary decision table

| Situation | Boundary plan |
|---|---|
| Messages < 80k and next phase is Tiny/Small | continue |
| Messages 80k–120k and next phase is small/local | compact first |
| Messages 80k–120k and next phase needs broad exploration/review | fresh session or sub-agent boundary |
| Messages 120k–150k | create handoff, then compact first or fresh session |
| Messages 150k+ | create handoff if possible, then fresh session |
| Near limit or API 400 | fresh session from artifacts; do not continue old context |
| Next step is independent QA/review | sub-agent boundary from latest handoff |
| Next phase needs different role and current context is noisy | fresh session or sub-agent boundary |
| Tool lacks compact/context metrics | fresh session when risk is medium/high |

Use `compact first` when the current session is still usable and the next phase is short.

Use `fresh session` when the next phase is long, role-shifted, broad, or current `Messages` are already high.

Use `sub-agent boundary` when the next step can be independently scoped and should return a bounded verdict/report.

---

## Context circuit breaker

Create or update a handoff before continuing when any trigger occurs:

- a phase boundary is reached,
- `/context` shows `Messages` above 120k on a 200k model,
- file reads exceed 50k tokens,
- a command returns long output,
- a sub-agent returns a long response,
- more than 5 substantial tool calls have happened since the last checkpoint,
- review/fix loop repeats more than once,
- broad repo exploration is about to start,
- more than N large source files have been read for the current phase,
- git diff is large or spans many files,
- the phase spans multiple work sessions,
- competing solution directions appear,
- user changes requirements,
- task mode escalates,
- a specialized sub-agent is about to be launched,
- Claude Code feels slow, confused, or loses state,
- the user reports context pressure,
- Claude Code returns API 400 context-window error.

Recommended thresholds for a 200k context model:

```text
Messages < 80k       normal
80k–120k             be careful; avoid broad reads
120k–150k            checkpoint + compact soon
150k+                create handoff and prefer fresh session
Near limit / 400     current session may not recover; use fresh session from artifacts
```

Do not rely on a graceful stop after the model limit is already exceeded. The recovery path is a fresh session from artifacts.

Before broad repo exploration, create an exploration plan and output cap.

---

## Recovery from context-window failure

If an API 400 context-window error occurs:

1. stop broad work immediately,
2. do not paste previous transcript into a new prompt,
3. start a fresh session,
4. read `resume.md` first,
5. read the latest canonical handoff,
6. run the minimum sanity check,
7. continue from the recorded next action.

If no handoff exists:

1. create a minimal recovery `resume.md` from available files and repository status,
2. do not reconstruct long history from memory unless unavoidable,
3. mark confidence as `low`,
4. list missing decisions/evidence,
5. ask only blocking questions,
6. continue with a small context plan.

### Recovery confidence levels

- `high` — branch is known, working tree is understood, latest handoff or equivalent artifact exists, changed files can be verified, and latest evidence is fresh.
- `medium` — branch and changed files are known, but some evidence/artifacts are missing or old.
- `low` — no usable handoff exists, state is reconstructed mainly from git status/files, user decisions are missing, or evidence freshness cannot be verified.

Minimal recovery resume:

```markdown
# Recovery Resume — <Work Item>

## Confidence
- Level: low | medium | high
- Reason:

## Known state
- Branch:
- Working tree summary:
- Known changed files:
- Known artifacts:

## Missing evidence
- Missing:
- Risk:
- Severity:

## Next safe action
- Action:
- Stop condition:
```

---

## Tool output rules

Noisy commands must write raw output to files, not chat.

Preferred pattern:

```text
1. run command,
2. write full output to docs/reports/<slug>/logs/<timestamp>-<command>.log,
3. print only command summary.
```

Command summary format:

```markdown
### <command>
- Exit code:
- Status: passed | failed | skipped
- Log: docs/reports/<slug>/logs/<timestamp>-<command>.log
- Top errors:
  1.
  2.
  3.
```

Rules:

- top errors: max 3–5,
- stack trace stays in log file,
- full diff stays out of chat,
- full test output stays out of chat,
- broad search output must be capped.

Use summary commands first:

```text
git diff --stat
git diff --name-status
git diff --check
```

Only inspect specific hunks after the summary identifies where to look.

---

## File reading rules

The next phase reads only what the handoff requires.

Prefer:

- targeted file ranges,
- symbol-level lookup,
- path-specific search,
- summarized artifacts,
- report files.

Avoid:

- reading entire large files,
- reading whole directories,
- rereading docs already summarized in handoff,
- reading raw logs unless debugging a listed failure,
- reading sub-agent transcripts.

If a broad read seems necessary, first ask:

```text
What exact question am I trying to answer, and can a narrower artifact or search answer it?
```

---

## Sub-agent output rules

Sub-agents may inspect more broadly than the Main Agent when their role requires it, but they must start from the handoff, use targeted exploration first, and report narrowly.

Default output cap:

```text
- verdict: pass | fail | blocked | needs-review
- max 5 primary findings in the chat response
- max 10 file citations in the chat response
- max 1 short evidence paragraph per finding
- commands run and summary only
- report/log paths for detail
- no full logs
- no full diffs
- no full file contents
- no transcript
```

Coverage rule:

- If QA finds more than 5 issues, the chat response lists the top 5 by severity and writes the full finding list to `reviews/qa-review.md`.
- The Main Agent should read only the summary first.
- The Main Agent reads the full review artifact only if it needs to fix or adjudicate a specific finding.
- A bounded response cap is not a coverage cap; it is a chat-output cap.

---

## QA sub-agent prompt and short next-phase prompt

Both prompts are defined once, canonically, in [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) § QA sub-agent prompt and § Short next-phase prompt. Use the QA verdict vocabulary from this document (`pass | yellow | fail | blocked`) when filling them in.

---

## Definition of Done by mode

Definition of Done determines whether the work may be considered complete. The final verification contract determines how the completion claim must be stated.

### Tiny

- change made,
- changed files match the described scope,
- manual or obvious verification noted,
- no unresolved blocker,
- risks none or listed with severity.

### Small

- changed files summary exists,
- relevant test/build/manual check run or skipped with reason,
- no unresolved blocker,
- final response states what was and was not verified.

### Standard

- required Code → Test handoff exists,
- required Test → QA handoff exists,
- relevant tests/build evidence exists or skipped commands include reason/risk,
- QA verdict is `pass`, `yellow`, `fail`, or `blocked`,
- unresolved risks listed,
- project-required impact/change analysis completed when applicable.

### Full

- all required phase handoffs exist or are explicitly marked not applicable,
- approval gates satisfied,
- QA/security/performance review completed as applicable,
- release/merge recommendation documented,
- final handover artifact exists,
- unresolved risks and unverified areas are listed.

---

## Final verification contract before final claims

This section does not replace Definition of Done. It controls the format and evidence required for the final user-facing claim.

Before the Main Agent says work is complete, the latest QA/Handover artifact or final summary must show:

- `git diff --check` passed, if code changed,
- build passed, if the project has a relevant build command,
- relevant tests passed, or explicitly list tests not run with reason/risk,
- QA verdict: `pass`, `yellow`, `fail`, or `blocked`,
- unresolved risks listed,
- project-required change/impact analysis when code changed,
- final changed files summary,
- evidence freshness statement.

If any evidence is missing, final response must say:

```text
Implemented, but not fully verified because <reason>.
```

For non-code work, replace build/test evidence with the relevant review/link/lint/artifact verification.

Do not claim `done`, `fixed`, or `passing` from memory alone.

---

## Handoff quality checklist

A handoff is acceptable when the next phase can start within five minutes without reading old chat.

Check:

- mode and phase are clear,
- mandatory sections are present,
- approval state and evidence are clear,
- severity/status/verdict mapping is consistent,
- branch/working tree/evidence identity is captured,
- next action is specific,
- important claims have fresh evidence paths,
- raw logs/diffs/files/secrets are not pasted,
- risks/blockers are explicit,
- source-of-truth priority is satisfied,
- artifact is under target size,
- read budget is explicit,
- `resume.md` points to this handoff,
- change requests are captured when requirements changed,
- stale handoff checks pass.

If this checklist fails, fix the handoff before crossing the phase boundary.

---

## Recommended document layering

To avoid making every operational doc too long, split usage into layers:

1. **Short operational rules** — read frequently; belongs in context-budget/workflow docs.
2. **Templates** — read when creating a handoff; belongs in handoff template docs.
3. **Full protocol/reference** — read when designing or debugging the workflow; this document.

A short operational doc should include only:

- artifact-first, not chat-first,
- choose mode,
- create bounded handoff at real phase boundary,
- run structured sanity check,
- never paste logs/diffs/secrets,
- final claims require evidence.

---

## Installed `phase-handoff` skill

The `phase-handoff` skill is installed by `hero-vibe-kit init/update` under `.claude/skills/phase-handoff/SKILL.md` (and mirrored to `.cursor/skills/`). Invoke it at every real phase boundary.

The skill does only this:

1. identify mode, current phase, and next phase,
2. select the right phase-specific template,
3. run the stale/freshness/sanity checks,
4. collect required state from artifacts and verified command summaries,
5. write or update the canonical handoff,
6. archive the previous canonical version when updating,
7. update `resume.md`,
8. checkpoint `.hero-vibe-kit/session.json` (phase, resumePath, nextAction, lastCheckpoint),
9. output the short next-phase prompt,
10. recommend `/compact` or fresh session based on context pressure.

It does not:

- implement code,
- run broad exploration,
- paste logs or diffs,
- rewrite the entire plan,
- duplicate every artifact into the handoff.

For optional YAML frontmatter on canonical handoffs (enables `doctor` drift detection), see [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) § Optional YAML frontmatter.

---

## Generic implementation acceptance criteria

The protocol is implemented when:

- workflow modes are defined and referenced,
- mode selection checklist exists,
- escalation and de-escalation paths exist,
- real phase boundary is defined,
- severity/status/verdict model exists,
- Standard/Full phase boundaries require bounded handoff artifacts,
- Tiny/Small paths avoid unnecessary ceremony,
- `resume.md` points to the latest canonical handoff,
- handoffs use base + phase-specific templates,
- mandatory/optional sections are labeled,
- handoffs have token targets, line density signals, read budgets, and write budgets,
- source-of-truth priority distinguishes requirement changes from process/style instructions,
- approval state requires approval evidence,
- change requests, mode changes, archive/versioning, garbage collection, and concurrency rules exist,
- stale handoff and evidence freshness rules exist,
- important claims require fresh evidence paths,
- next phases run minimum sanity checks with pass/warn/block output,
- raw logs/diffs/secrets are stored safely and not pasted into chat,
- sub-agent prompts include strict chat-output caps without treating them as QA coverage caps,
- non-code work has an evidence path,
- final claims require the Definition of Done and final verification contract,
- API 400 recovery tells users to start fresh from artifacts,
- tool-specific adaptations are documented locally.

---

## Project-specific integration appendix: hero-vibe-kit

The protocol above is generic. The following applies when integrating it into `hero-vibe-kit`.

Recommended framework changes:

1. Keep the full protocol as a reference document at `templates/docs/PHASE_HANDOFF_PROTOCOL.md` or link to this reference.
2. Do **not** copy the full protocol into `CONTEXT_BUDGET.md` or `AGENCY_WORKFLOW.md`.
3. Add only a short operational version to `templates/docs/CONTEXT_BUDGET.md`.
4. Add only phase-boundary and mode-selection rules to `templates/docs/AGENCY_WORKFLOW.md`.
5. Add phase-specific handoff prompts to `templates/docs/HANDOFF_TEMPLATES.md`.
6. Optionally add a curated `templates/skills/phase-handoff/` skill if licensing and attribution rules allow it.
7. Update tests to verify document links and template references.

English-only template checks should verify:

- the single `templates/docs/` tree has no broken links,
- handoff template names stay wired into the workflow,
- skill references remain valid,
- protocol-specific acceptance criteria remain present.

Because this framework uses English-only templates, any template-doc change is made once under `templates/docs/`.

---

## Example end-to-end flow

```text
1. BA completes discovery.
2. Main Agent writes:
   docs/reports/2026-06-07-checkout-flow/handoffs/01-ba-to-design.md
3. Main Agent updates:
   docs/reports/2026-06-07-checkout-flow/resume.md
4. Main Agent runs /compact or asks user to start a fresh session.
5. Design phase starts artifact-first from resume.md and 01-ba-to-design.md.
6. Design completes and writes 02-design-to-code.md.
7. Code phase starts from 02-design-to-code.md after structured sanity check.
8. Code writes 03-code-to-test.md with changed files and command summaries.
9. Test writes 04-test-to-qa.md with test evidence and gaps.
10. QA sub-agent reads 04-test-to-qa.md and returns a bounded verdict.
11. Main Agent writes 05-qa-to-handover.md.
12. Main Agent makes final claims only from verified evidence in the handover artifact.
```

---

## Final rule

```text
No phase may hand off to the next phase using chat history as the primary context.
Every non-trivial phase transition must use a bounded, evidence-backed artifact.
When context pressure is medium or high, the handoff must be followed by compact, fresh session, or sub-agent/workflow boundary.
```
