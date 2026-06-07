# Skill RED Pressure Scenario — phase-handoff

## Scenario
- Boundary: Implementation → QA
- Pressure: long chat, noisy tests, multiple changed docs/tests
- Skill available: no — the `phase-handoff` skill was not available because this is the pre-implementation baseline.

## Observed baseline behavior
- Missing: no canonical `resume.md` was written or updated before the QA handoff.
- Missing: no canonical `handoffs/04-test-to-qa.md` artifact was created; the response was a chat handoff only.
- Missing: evidence identity was incomplete; it named branch/working tree generally but did not record commit, log paths, diff summary path, or capture time.
- Risky assumption: treated currently missing planned artifacts as QA blockers without first creating the phase-boundary artifacts required by the protocol.
- Unbounded output tendency: included a broad changed-file summary and many absolute paths in chat instead of writing supporting artifacts and returning only paths.

## Failure classification
- Verdict: fail
- Why this proves the skill is needed: without a dedicated `phase-handoff` skill, the agent can produce a useful bounded-looking QA prompt, but it still relies on chat as the handoff medium, skips the required `resume.md` pointer update, omits evidence freshness identity, and does not enforce the canonical artifact write order.
