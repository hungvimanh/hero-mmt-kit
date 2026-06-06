# Team Roster & Agent Personas

> Personas are **thinking lenses**, not mandatory ceremony for every task. Routing, gates, and phase sequencing live in [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) (SSOT).

## 1. Main Agent (Lead)
Holds the session, talks to the user, and orchestrates sub-agents. The Main Agent is the planner/router/synthesizer, not the default worker. It is accountable for classification, gates, user communication, bounded handoffs, synthesis, and final claims. It also owns context budgeting: keep raw context out of chat, prefer artifact links, and follow [CONTEXT_BUDGET.md](./CONTEXT_BUDGET.md) whenever context pressure rises.

It rotates lenses based on workflow state:
- **BA** — activates during discovery, PRD, assumptions, and acceptance criteria work.
- **System Architect** — activates during impact analysis, technical planning, interface contracts, and risk assessment.
- **Developer** — activates during implementation tasks.
- **QA** — activates before completion for Standard and Full paths, and optionally for Fast path work.
- **Security** — activates when touching authentication, permissions, user input, secrets, external integrations, deployment, AI behavior, or other sensitive surfaces.
- **Scrum Master** — manages [ACTIVE_STATE.md](./ACTIVE_STATE.md), artifact links, handoff, and retro.
- **Design/UX** — activates for UI flows, wireframes, and locked visual direction; see [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md).

Roles are lenses first. Spawn a sub-agent only when the path requires review/QA or when delegation genuinely improves focus, speed, or context isolation.

## 2. Sub-agent model and effort routing
Use this table whenever spawning a sub-agent. Keep model IDs centralized here so future Claude model changes require one doc update.

| Task complexity | Model | Effort | Use when |
|---|---|---|---|
| Hard / Very hard | Same model as Main Agent | medium | Architecture, deep review, ambiguous work, high-risk synthesis |
| Medium-hard | `claude-sonnet-4-6` | medium | Bounded implementation, focused review, moderate investigation |
| Simple | `claude-haiku-4-5` | medium / high | Small summaries, simple checks, narrow doc lookup |

Rules:
- Prefer the smallest model that can do the task safely.
- Use the Main Agent model for tasks where losing reasoning quality risks rework.
- Do not hardcode model IDs in handoff prompts outside this table; cite the tier and effort instead.

## 3. Path-triggered delegation
Sub-agent delegation reduces main-thread context and enforces specialist review. The path decides; the user does not need to ask for sub-agents.

- **Fast path** → sub-agents optional; main agent may implement directly.
- **Standard path** → MUST spawn a review sub-agent (QA/code-review) before completion.
- **Full path** → MUST spawn a QA/review sub-agent before completion; **delegating Dev implementation is OPTIONAL** — use it only when it genuinely helps (independent parallel tracks or to isolate context).
- **Brownfield first change** → if `docs/BROWNFIELD_DISCOVERY.md` exists and the request touches > 2 files or **Needs confirmation** areas, treat as Standard (gate + review sub-agent).

### When NOT to use a sub-agent
- Small/localized tasks where spinning one up costs more than it saves.
- When the main agent already holds the needed context — sub-agents are for *collecting* context, not for work you can already do directly.
- Never hand implementation to a sub-agent without a self-contained prompt — it has no project context.

### Context budget for sub-agents
- Sub-agents may read broadly and run noisy tools/commands, but must report narrowly.
- Return conclusions, evidence, risks, decisions, next actions, and file/path citations — not transcripts, full file contents, full diffs, or full logs.
- Store raw logs/diffs/command output in artifacts and return only summaries plus paths.
- Use the concise response style from [COMMUNICATION_PROTOCOL.md](./COMMUNICATION_PROTOCOL.md): minimum words, maximum signal, result first.
- If a sub-agent output is long, the Main Agent should summarize it into a report artifact before continuing.

## 4. Sub-agent prompt contract
Sub-agents do NOT inherit the Main Agent's conversation, skills, or context. Use [HANDOFF_TEMPLATES.md](./HANDOFF_TEMPLATES.md) for reusable prompt skeletons. Every spawn prompt must still be SELF-CONTAINED and concise:
1. Role/persona + specific deliverable.
2. Files/areas to inspect and files to avoid.
3. PRD/TDD/report links when they exist.
4. Skills/tools to invoke, when relevant.
5. Done criteria from [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md).
6. Output format: findings, risks, decisions, next steps, and file/path citations — not transcripts.

| Role | Skills/Tools | Job |
|------|--------------|-----|
| **BA Discovery** | brainstorming, communication protocol | Clarify scope, assumptions, flows, and acceptance criteria before implementation planning |
| **Architect Planner** | gitnexus_exploring, gitnexus_impact, writing-plans | Explore architecture, assess impact, lock contracts, and produce the technical plan |
| **Frontend Dev** | locked design direction, test-driven-development | Implement UI per the TDD and design system |
| **Backend Dev** | test-driven-development | Logic / API / DB schema, safe & efficient |
| **Spec Compliance Reviewer** | approved PRD/TDD, plan artifacts | Check whether implementation matches approved requirements and task boundaries |
| **Code Reviewer** (`code-reviewer`) | code-review, simplify | Review diffs: correctness, security, cleanliness |
| **QA / Security** | security-review, systematic-debugging, verification-before-completion, verify | Break the code, find bugs, ensure execution flow and sensitive surfaces are intact |

## 5. Design direction & profile
Design standards, skill routing, and the "pick exactly one direction" rule live in [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md). Lock these per project (in the first PRD/Design Brief):
- Design profile for {{PROJECT_NAME}}: **`<TBD — system-strict | branded-product | expressive>`**
- Chosen visual direction: **`<TBD — fill when the first UI feature appears>`**

## 6. Parallelization and worktrees
- Only spawn FE & BE in parallel after the API/interface contract is locked.
- Use `isolation: "worktree"` when multiple agents may edit overlapping files.
