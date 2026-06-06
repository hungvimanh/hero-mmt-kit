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
