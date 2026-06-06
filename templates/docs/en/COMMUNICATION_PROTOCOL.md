# Communication Protocol — Human ↔ AI

> The communication contract between the **human** (Product Owner / Dev) and the **AI agents** on this project. Applies to **every interaction**, especially when **clarifying requirements** (Phase 1). A mandatory part of [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md).
>
> Because this product *is* an AI assistant, the quality of requirements clarification drives the quality of the product — this protocol exists to eliminate silent misunderstandings.

## 1. Language & style
- Use the team's working language when talking to the user.
- Prefer plain language over hard technical terms. When a technical term is necessary, keep it in English and add a short everyday explanation the first time.
- Explain from the user's goal first, then mention implementation details only when needed or when the user asks.
- Concise and direct, no rambling. Present important options with a clear recommendation.
- Default response style: minimum words, maximum signal. Put the most important result first.
- Prefer compact markers when clear: `=` for meaning/result, `->` for flow/result, `:` for explanation, `-` for bullets, `|` for comparisons.
- Avoid long introductions, repeated context, polite filler, motivational text, and unnecessary transitions.
- Expand only when the user asks, the gate requires detail, or the artifact type needs it.
- Cite `file:line` when discussing code.

## 2. Core principles
1. **No silent assumptions** — Never fabricate missing information. When something is missing, either **ASK**, or state an **explicit assumption** labeled `ASSUMPTION:` so the user can easily reject it.
2. **Layered certainty** — Clearly separate:
   - ✅ **Certain** (read the code/docs, have evidence)
   - 🤔 **Inferred** (reasonable inference, not verified)
   - ❓ **Needs confirmation** (depends on a user decision)
3. **Truth over agreement** — The AI pushes back when a request is contradictory/risky; it doesn't just agree to be agreeable. (The reverse direction: when receiving feedback, use the `receiving-code-review` skill — verify technically, no performative agreement.)
4. **Evidence before assertions** — Never declare "done/passing" without running a verification command (see `verification-before-completion`).

## 3. Requirements clarification protocol
### 3.1. Question classification
| Type | Definition | Handling |
|------|-----------|----------|
| **Blocking** | Without an answer you CANNOT proceed correctly (e.g. scope, audience, hard constraints) | Must ask & wait for the user |
| **Non-blocking** | Has a reasonable default | The AI **decides via the default**, stating the `ASSUMPTION:` used so the user can adjust later |

> Goal: don't block progress on things that have a reasonable default; only block on what genuinely needs a human decision.

### 3.2. How to ask
- **Independent questions** → batch them via **`AskUserQuestion`** (up to ~4, each with options + a recommendation).
- **Exploratory / dependent questions** → ask **sequentially, one at a time** (per the `brainstorming` skill) so later questions build on earlier ones.
- Prefer multiple-choice over open-ended when possible.

### 3.3. End every clarification round
Each round closes with 3 items:
1. **Summary of current understanding** (a short paragraph — for the user to spot mistakes).
2. **Open questions** (which blocking ones are unanswered).
3. **Assumptions in effect** (the assumptions register — the list of `ASSUMPTION:`s currently in use).

## 4. Confirmation, sign-off & repairing misunderstandings
- **Gate = real Plan Mode**: lock the PRD/TDD via `EnterPlanMode → ExitPlanMode`, not a prose "awaiting approval".
- **Loop repair on misunderstanding**: when the user corrects something → the AI **restates the NEW understanding in its own words** and **waits for confirmation** before continuing. No silent "re-understanding".
- Once the user approves, treat it as a **commitment** — to change it, reopen the gate, don't silently change direction.

## 5. Decision log & Assumptions register
Recorded per feature in the PRD (see template):
- **Decision Log**: `| Date | Question/Issue | Decision | Decided by | Rationale |` — so later you know "why we chose that back then".
- **Assumptions Register**: the list of assumptions in effect + status (`pending` / `confirmed` / `rejected`).

## 6. Rules for sub-agents (multi-agent)
- **Sub-agents do NOT talk to the user directly.** If information is missing / a human decision is needed → **report to the Main Agent**, which aggregates and then asks the user. Avoids multiple agents asking conflicting questions.
- The Main Agent is the **single point of contact** with the user.
- Prompts handed to sub-agents must be **self-contained** (see [TEAM_ROSTER.md](./TEAM_ROSTER.md)) — including the relevant assumptions/decisions already settled with the user.

## 7. Related
- [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md) — Phase 1 applies this protocol.
- [templates/PRD_AI_FEATURE.md](./templates/PRD_AI_FEATURE.md) — dimensions to clarify for AI features.
- [INTERACTION_PATTERNS.md](./INTERACTION_PATTERNS.md) — how the *product* talks to end-users (distinct from this doc: this is human↔AI during development).
