# Harness + Loop Engineering — Design Spec

Date: 2026-06-16  
Status: Draft — pending plan approval  
Target release: **2.0.0**

## 1. Purpose

hero-vibe-kit v1.x provides strong **policy** (router, gates, handoffs, skills) but weak **visibility** — there is no checkable record of where the workflow is, so skipped steps are invisible until something breaks. v2.0.0 adds:

- **Harness engineering** — an *observable, checkable* compliance layer via session state, extended `doctor` (incl. drift detection), and soft hooks.
- **Loop engineering** — deterministic phase/session loops via strengthened `phase-handoff` skill wired to the router.

**Positioning (be precise):** this layer makes workflow state *observable*, not *enforced*. Session writes are voluntary; the value is visibility, drift detection, and resumability — not a runtime that prevents an agent from skipping a gate. The only hard guardrail remains `git-guard`. Any new hard block is deferred to 2.1+.

**Non-goal:** a separate orchestrator runtime, MCP server, or new npm dependencies.

## 2. Problem statement

| Failure mode | v1.x mitigation | v2.0.0 mitigation |
|--------------|-----------------|-------------------|
| Agent skips impact analysis / gates | Prose in AGENCY_WORKFLOW | Session records gate status; doctor warns + detects drift vs handoff/ACTIVE_STATE |
| Context blow-up across phases | PHASE_HANDOFF_PROTOCOL + skill | phase-handoff + session checkpoint pointers |
| False completion claims | DoD + verification skill | doctor checks evidence paths when strict |
| Sub-agent handoff quality | HANDOFF_TEMPLATES | Optional frontmatter + validator |
| git unsafe ops | git-guard (hard) | unchanged |
| ACTIVE_STATE not updated | stop-reminder (soft) | **commit gate blocks Standard/Full without a checkpoint** — user no longer prompts for this |
| Missing context on resume | Resume Protocol (prose) | `session.json` hot pointer (`resumePath`+`nextAction`) read first; ≤2 small files to resume |
| Token waste reading state | "keep it short" (prose) | `session.json` first (~200 tok), `ACTIVE_STATE` stays a short index, detail read lazily; doctor warns on bloat |

## 3. Design principles

1. **Additive evolution** — SSOT (`AGENCY_WORKFLOW.md`) unchanged in role; mechanics extend it.
2. **Warn-first, strict optional** — default install friendly; CI uses `doctor --strict`.
3. **Lean by default** — Fast/Tiny paths exempt from canonical handoffs and heavy session updates.
4. **Zero runtime deps** — validators and hooks use Node built-ins only.
5. **Fail-safe hooks** — malformed input → exit 0.
6. **Separate durable vs session state** — `ACTIVE_STATE.md` = backlog; `session.json` = current loop pointer.
7. **Artifacts are authoritative, session is derived** — on any conflict, handoff artifacts + `ACTIVE_STATE.md` win; `session.json` is treated as suspect and a stale session is surfaced as drift, never trusted blindly.

## 4. Architecture

```text
User request
    │
    ▼
Main Agent + AGENCY_WORKFLOW router (SSOT, prose)
    │
    ├── phase-handoff skill (loop executor at boundaries)
    │         │
    │         ▼
    │   .hero-vibe-kit/session.json
    │
    ├── handoff artifacts (docs/reports/.../handoffs/)
    │
    └── harness layer
              ├── doctor (compliance read)
              ├── workflow-check hook (soft remind)
              └── git-guard / stop-reminder (existing)
```

## 5. Session state

See `docs/plans/2026-06-16-harness-loop-engineering-2.0.0.md` § Session schema.

- Written by agent following `phase-handoff` skill.
- Read by `doctor`, `workflow-check`, and agent on resume.
- Seeded on `init`; preserved on `update`.

### Resume read order (token + context discipline)

A fresh session — opened at any time — answers "what's done / in progress / where / next" by reading **in this order, stopping when it has enough**:

1. `.hero-vibe-kit/session.json` (~200 tokens) → `workItem`, `phase`, `resumePath`, `nextAction`.
2. The `resumePath` it names (one `resume.md`) → concrete next action + read-first list.
3. The latest handoff under `docs/reports/<slug>/handoffs/` only if step 2 is insufficient.

`ACTIVE_STATE.md` is **not** on the hot path — it is the durable backlog index, consulted only to see all active items or switch work. It stays a single short file: one row per *active* item; completed work is archived to `docs/reports/<slug>/` and the row replaced by a one-line link. **No per-item split** — splitting would force more file reads at resume (more tokens), defeating the goal. "What was done historically" is answered by git log + reports, never by appending to `ACTIVE_STATE.md`.

## 6. Handoff validation

- Optional YAML frontmatter on canonical handoffs.
- Legacy markdown-only handoffs: validator emits warnings, not errors.
- Required body sections scale by `mode` (tiny → full).

## 7. Hook policy (v2.0.0)

| Hook | Behavior |
|------|----------|
| git-guard | unchanged (hard block) |
| stop-reminder | unchanged (soft) — covers pause-without-commit |
| workflow-check | **new, HARD path-aware gate** — blocks `git commit` on Standard/Full when the change lacks a state checkpoint; Read-only/Fast/Tiny exempt; `HVK_SKIP_STATE_GATE=1` override; fail-safe exit 0 on missing/legacy session |

The commit gate is the mechanism that removes the manual "update state" reminder — warn-only could not, since it still relies on agent compliance. The Stop-event time-based reminder is **cut** from 2.0.0 (noisy, stale-prone); the deterministic commit gate replaces its intent. `loop.*`/`lastCheckpoint` are reserved; `lastCheckpoint` advancing is one way to satisfy the gate.

## 8. SemVer

2.0.0 because installed surface and `doctor` contract expand. Mitigated by warn-first defaults and idempotent `update`.

## 9. Out of scope

- Orchestrator service / worker queue
- Auto `/compact` or session management inside IDE
- Consumer CI workflow templates (document only)
- Bilingual templates
- Replacing `executing-plans` or `subagent-driven-development`

## 10. Success criteria

After 2.0.0 ships, a consumer project can:

1. Run `hero-vibe-kit doctor` and see workflow compliance status, including drift between session and artifacts.
2. Run `hero-vibe-kit doctor --strict` in CI with predictable results on fresh init (empty session is valid; strict earns its value on populated projects).
3. Resume cross-phase work from `session.json` + latest handoff without rereading full chat.
4. Keep Fast-path tasks lean (no mandatory handoff files).
5. Trust the tooling not to report green off a stale session — divergence is always surfaced.

## 11. References

- Plan: `docs/plans/2026-06-16-harness-loop-engineering-2.0.0.md`
- Prior: `docs/superpowers/specs/2026-06-06-process-first-self-prompting-workflow-design.md`
- Skill: `templates/skills/phase-handoff/SKILL.md`
- Protocol: `templates/docs/PHASE_HANDOFF_PROTOCOL.md`
