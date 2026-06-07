# Handoff Templates — Prompt Contracts

Use these templates when the workflow path requires the Main Agent to hand work to a sub-agent or to generate a focused internal prompt. These are prompt contracts, not full process definitions. Routing, gates, and path selection live in [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md); role behavior lives in [TEAM_ROSTER.md](./TEAM_ROSTER.md).

A handoff prompt must be self-contained because sub-agents do not inherit the Main Agent's conversation, skills, or local context.

## 1. Base contract

Every handoff should include:

```text
Role:
Goal:
Inputs:
Required context:
Model tier:
Effort:
Execution scope:
Commands/tools allowed:
Raw output policy:
Constraints:
Output format:
Context budget:
Done criteria:
```

Keep prompts short. Include only the context needed for the assigned scope. Set `Model tier` and `Effort` from [TEAM_ROSTER.md](./TEAM_ROSTER.md); do not hardcode model IDs in one-off prompts.

Default context budget: minimum words, maximum signal, result first. Do not return full transcripts, full diffs, full logs, or full file contents unless explicitly requested. If evidence is long, summarize it and cite the source path or command.

Default bounded report:

```text
Status:
Summary:
Files touched/read:
Commands/tools run:
Result:
Evidence:
Risks/blockers:
Next action:
Artifact/log paths:
```

## 1.1 Phase-boundary artifact templates

Use these operational templates when one workflow phase hands off to the next. Canonical handoff artifacts live under `docs/reports/YYYY-MM-DD-<slug>/handoffs/`. Keep `resume.md` short: it should point to the current phase report, active handoff file, latest gate decision, and next action instead of duplicating the report.

Base handoff artifact:

```text
# <Phase> handoff

Work item:
Mode: tiny | small | standard | full
From phase:
To phase:
Status: green | yellow | red
Approval: draft | approved | auto-approved | blocked
Approved by:
Approval evidence:
Approval note:
Branch:
Base commit:
Working tree state:
Evidence captured against:
Last updated:

## Source of truth
- Latest user instruction:
- Latest approved handoff/amendment:
- Referenced artifacts:
- Evidence paths:

## Read first
- Files or sections the next agent must read:
- Commands or logs to trust:
- Constraints that changed during the phase:

## Do not read
- Large transcripts, raw logs, or exploratory files that are superseded:
- Outdated assumptions or discarded options:

## Next action
- First action for the next phase:
- Gate or approval needed:
- Expected output artifact:
```

### BA / Discovery → Design / Architecture

```text
Role: Design / Architecture lens.
Goal: Convert approved discovery into a technical direction without re-litigating scope.
Inputs: Discovery report, approved PRD/scope, user decisions, known constraints, and open questions.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/discovery.md and docs/reports/YYYY-MM-DD-<slug>/handoffs/01-ba-to-design.md.
Read first: Approved goals, non-goals, actors, acceptance criteria, constraints, and unresolved decisions.
Do not read: Raw interview notes or exploratory logs unless cited as source of truth.
Next action: Produce architecture options, recommended approach, risks, impact-analysis targets, and the approval gate.
Output: Architecture summary, affected areas, interface contracts, verification strategy, risks, and open decisions.
```

### Design / Architecture → Code

```text
Role: Developer implementer.
Goal: Implement only the approved technical plan task or task slice.
Inputs: Approved architecture plan, task breakdown, interface contract, target files, tests to run, and constraints.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/architecture.md and docs/reports/YYYY-MM-DD-<slug>/handoffs/02-design-to-code.md.
Read first: Task boundaries, required impact analysis, data/API contracts, migration notes, and Definition of Done.
Do not read: Superseded design alternatives or broad repository history unless cited by the plan.
Next action: Confirm task scope, run required pre-edit analysis, implement the smallest safe slice, and record changed files/tests.
Output: Status, files changed, tests run, evidence, concerns, and next review target.
```

### Code → Test

```text
Role: Test-focused reviewer.
Goal: Validate the implementation against the approved scope and identify missing automated or manual coverage.
Inputs: Implementation summary, changed files, approved plan, test commands already run, and known risks.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/implementation.md and docs/reports/YYYY-MM-DD-<slug>/handoffs/03-code-to-test.md.
Read first: Diff summary, acceptance criteria, edge cases, existing test evidence, and untested areas.
Do not read: Full diffs or raw logs unless a cited failure needs inspection.
Next action: Run or recommend targeted tests, map coverage to acceptance criteria, and list gaps.
Output: Test verdict, commands run, pass/fail evidence, missing coverage, and required fixes.
```

### Test → Verify / QA

```text
Role: Verify / QA lens.
Goal: Challenge the tested change with path-specific DoD, regression, security, and user-outcome checks.
Inputs: Test report, implementation summary, approved scope, changed files, known risks, and verification instructions.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/test.md and docs/reports/YYYY-MM-DD-<slug>/handoffs/04-test-to-qa.md.
Read first: Test verdict, failures or skipped tests, manual verification steps, risk list, and DoD checklist.
Do not read: Passing raw logs unless summarized evidence is disputed.
Next action: Verify the user-facing outcome or documented artifact, probe risk areas, and decide pass/fix/block.
Output: QA verdict, checks performed, evidence, suspected risks, required fixes, and handover readiness.
```

### Verify / QA → Handover

```text
Role: Handover / Scrum Master lens.
Goal: Close the work with accurate evidence, residual risk, and next-owner instructions.
Inputs: QA verdict, verification evidence, changed artifacts, decision log, and unresolved risks.
Source of truth: docs/reports/YYYY-MM-DD-<slug>/qa.md and docs/reports/YYYY-MM-DD-<slug>/handoffs/05-qa-to-handover.md.
Read first: Final verdict, remaining risks, accepted deviations, commands run, and artifact paths.
Do not read: Intermediate scratch notes superseded by the final QA report.
Next action: Prepare final bounded report, update resume.md pointer if needed, and state any follow-up work.
Output: What changed, evidence, files/artifacts, risks, user-facing result, and next action.
```

### QA sub-agent prompt

```text
Role: QA sub-agent.
Goal: Independently verify the phase output and try to find high-signal failures before handover.
Inputs: Active handoff file, canonical report paths, changed files, commands to run, and known risks.
Required context: DEFINITION_OF_DONE.md, AGENCY_WORKFLOW.md QA requirements, and relevant standards documents.
Constraints: Do not rubber-stamp. Do not broaden scope. Summarize long logs and cite commands/files. If evidence is missing, say so.
Output format: Status, checks performed, evidence, failures or gaps, risk assessment, and recommendation: PASS, PASS_WITH_CONCERNS, FIX_REQUIRED, or BLOCKED.
Done criteria: Main Agent can either fix specific issues or hand over with defensible evidence.
```

### Short next-phase prompt

```text
Continue from: docs/reports/YYYY-MM-DD-<slug>/handoffs/<phase-to-phase>.md
Read first: resume.md, the active handoff, and the canonical report paths listed there.
Do not read: Raw transcripts or superseded scratch files unless the handoff explicitly says to.
Next action: Complete the first action in the handoff, produce the expected artifact, and return a bounded report.
```

## 2. BA Discovery Prompt

```text
Role: Business Analyst (BA) lens.
Goal: Turn the user's idea into a clear PRD/scope proposal with user goals, core flows, acceptance criteria, assumptions, and blocking questions.
Inputs: User request, relevant business context, existing specs if any, and links to docs that constrain the feature.
Required context: AGENCY_WORKFLOW.md Full path Phase 1, COMMUNICATION_PROTOCOL.md, ARTIFACTS_AND_STORAGE.md, and PRD_AI_FEATURE.md when the work is an AI/assistant feature.
Constraints: Do not design implementation details, choose technologies, or write code. Ask one blocking question at a time when the scope is unclear.
Output format: Summary, proposed scope, user personas or actors, main flows, acceptance criteria, assumptions, risks, blocking questions, and recommended next gate.
Done criteria: The Main Agent can present a PRD/scope artifact for user approval or knows exactly which blocking question to ask next.
```

## 3. Architect Planning Prompt

```text
Role: System Architect lens.
Goal: Convert approved scope into a technical plan with architecture notes, impact analysis, interface contracts, risks, and implementation tasks.
Inputs: Approved PRD/scope, relevant files or modules, impact-analysis results, constraints, and existing plans if any.
Required context: AGENCY_WORKFLOW.md Standard or Full path, TEAM_ROSTER.md, SECURITY_STANDARDS.md, PERFORMANCE_STANDARDS.md, ARTIFACTS_AND_STORAGE.md, and any brownfield discovery report.
Constraints: Do not edit code before the required gate. Do not broaden scope beyond the approved PRD. Warn on HIGH or CRITICAL impact before proceeding.
Output format: Architecture summary, affected areas, interface/API contract, security/performance considerations, task breakdown, verification plan, risks, and open decisions.
Done criteria: The Main Agent can present a technical plan for user approval and can split implementation into bounded tasks.
```

## 4. Implementer Prompt

```text
Role: Developer implementer.
Goal: Complete one bounded implementation task exactly as specified.
Inputs: Approved plan task, relevant files, interface contract, tests to run, and constraints.
Required context: The specific task text, AGENCY_WORKFLOW.md path requirements, test-driven-development when required, and relevant snippets or file paths.
Constraints: Do not modify unrelated files. Do not add features, abstractions, fallbacks, or refactors outside the assigned task. Ask for context if the task is ambiguous.
Output format: Status (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED), files changed, tests run, evidence, concerns, and next recommended review.
Done criteria: The assigned task is implemented, path-required tests are run, and the Main Agent has enough evidence to start review.
```

## 5. Spec Compliance Reviewer Prompt

```text
Role: Spec compliance reviewer.
Goal: Check whether the implementation matches the approved PRD, plan, and task boundaries.
Inputs: Approved spec/plan, implementation summary, changed files, and test evidence.
Required context: The exact requirements being reviewed and any decision log entries that changed scope.
Constraints: Focus on missing requirements, extra behavior, contradictions, and ambiguous interpretations. Do not perform general style review unless it affects spec compliance.
Output format: Verdict, compliant items, missing items, extra behavior, ambiguities, required fixes, and file/path citations.
Context budget: Return only the verdict, high-signal gaps, evidence summary, and citations. Do not paste the full implementation or full spec.
Done criteria: The Main Agent knows whether to proceed to code quality review or send a focused fix prompt.
```

## 6. Code Quality Reviewer Prompt

```text
Role: Code quality reviewer.
Goal: Review changed code or docs for correctness, simplicity, reuse, maintainability, and efficiency.
Inputs: Changed files, implementation summary, and relevant constraints.
Required context: Project house rules, path-specific DoD, and any files needed to understand the changed surface.
Constraints: Prefer high-signal findings. Avoid style-only churn. Do not request broad refactors unrelated to the task.
Output format: Verdict, strengths, findings grouped by severity, suggested fixes, and file/path citations.
Context budget: Keep findings bounded and cite files. Do not paste full diffs, logs, or unrelated commentary.
Done criteria: The Main Agent knows whether the work is ready for final verification or needs targeted fixes.
```

## 7. QA / Security Reviewer Prompt

```text
Role: QA / Security reviewer.
Goal: Try to break the change and verify the path-specific Definition of Done, including security-sensitive behavior when applicable.
Inputs: Approved scope, implementation summary, changed files, test commands, verification evidence, and known risks.
Required context: DEFINITION_OF_DONE.md, SECURITY_STANDARDS.md, PERFORMANCE_STANDARDS.md when relevant, and AGENCY_WORKFLOW.md QA requirements.
Constraints: Do not rubber-stamp. Look for regressions, unsafe assumptions, missing validation at boundaries, permission/auth issues, AI guardrail gaps, and unverified claims.
Output format: Verdict, tests or checks reviewed, confirmed risks, suspected risks, missing evidence, required fixes, and file/path citations.
Context budget: Summarize long test/security evidence and cite commands or files. Do not paste full logs unless explicitly requested.
Done criteria: The Main Agent can either fix concrete issues or safely proceed to handover with evidence.
```

## 8. Brownfield Discovery Prompt

```text
Role: Brownfield discovery analyst.
Goal: Map existing project behavior before risky changes and separate evidence from assumptions.
Inputs: User request, BROWNFIELD_DISCOVERY.md if present, existing docs, likely code areas, tests, and known risky areas.
Required context: AGENCY_WORKFLOW.md brownfield rules, ARTIFACTS_AND_STORAGE.md, and COMMUNICATION_PROTOCOL.md.
Constraints: Do not infer business purpose without evidence. Do not change code. Mark uncertain areas as needing human confirmation.
Output format: Evidence-backed findings, likely areas, tests/commands found, risky flows, assumptions, confirmation questions, and recommended path escalation.
Done criteria: The Main Agent knows whether the work can proceed, must escalate to Standard, or needs user confirmation first.
```

## 9. Handover / Retro Prompt

```text
Role: Handover and Scrum Master lens.
Goal: Close the work with evidence, state updates, remaining risks, and a lightweight retro.
Inputs: Completed implementation summary, review results, verification evidence, changed artifacts, and unresolved risks.
Required context: ARTIFACTS_AND_STORAGE.md, DEFINITION_OF_DONE.md, BRANCHING.md, and the active workflow path.
Constraints: Do not claim completion without verification evidence. Do not hide unresolved risks. Do not update canonical docs unless the change introduced durable process or architecture decisions.
Output format: What changed, verification evidence, artifacts updated, unresolved risks, handover notes, and three-line retro.
Context budget: Summarize evidence and link artifacts. Do not duplicate full reports, diffs, or transcripts.
Done criteria: The Main Agent can report completion accurately and knows whether finishing-a-development-branch or another closeout step is needed.
```
