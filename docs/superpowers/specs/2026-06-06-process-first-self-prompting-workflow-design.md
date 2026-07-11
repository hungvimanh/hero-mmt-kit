# Process-first Self-Prompting Workflow — Design Spec

Date: 2026-06-06
Status: Draft for user review

## 1. Purpose

`hero-vibe-kit` should help Claude behave less like a passive chatbot and more like a workflow controller. The user should be able to state an outcome, while the framework guides Claude to classify the work, choose the right path, generate the next internal or sub-agent prompt, verify the result, update state, and continue only when the workflow allows it.

The goal is not to create more ceremony or spawn more agents by default. The goal is to make the existing agency workflow self-prompting: process decisions trigger the right lenses, handoffs, gates, and review steps without requiring the user to manually prompt each role.

## 2. Current foundation

The framework already has most of the pieces needed for this direction:

- `AGENCY_WORKFLOW.md` defines task classification, workflow paths, gates, required steps, and Definition of Done references.
- `TEAM_ROSTER.md` defines the Main Agent as the coordinator and describes path-triggered delegation.
- `dispatching-parallel-agents` explains when independent tasks should be delegated in parallel.
- `subagent-driven-development` defines fresh implementer/reviewer sub-agent loops for planned work.
- Brownfield discovery, communication, security, performance, design, artifacts, and Definition of Done docs already provide guardrails.

The missing piece is an explicit self-prompting layer that tells Claude how to turn workflow state into the next prompt or handoff.

## 3. Design principles

1. **Process-first, not agent-first.** Roles are activated by workflow path and task state, not by user ceremony.
2. **Lean by default.** Small tasks stay small; the framework must not force the Full path onto Fast path work.
3. **Path-triggered delegation.** The workflow decides when review or sub-agent delegation is required.
4. **Prompt contracts over ad hoc prompts.** Handoffs should use stable templates with clear inputs, constraints, output shape, and Done criteria.
5. **Main Agent remains accountable.** Sub-agents collect context, implement isolated tasks, or review; the Main Agent owns synthesis, user communication, gates, and final claims.
6. **Verification before advancement.** Claude should not move to handover or claim completion until the path-specific verification evidence exists.
7. **Bilingual parity.** Any template documentation change must be mirrored between English and Vietnamese.
8. **No new runtime dependency.** This phase should preserve the framework's zero-runtime-dependency rule.

## 4. Proposed workflow model

Add a named model to the framework: **Self-Prompting Loop**.

```text
User intent
  → classify task
  → select workflow path
  → identify required lenses/agents
  → prepare context and prompt contract
  → act directly or delegate
  → verify output
  → update state/artifacts
  → choose the next prompt
```

This loop should be described as a required operating behavior in the workflow docs. It does not replace the current router; it makes the router executable as a repeated decision cycle.

## 5. Workflow Router enhancement

`AGENCY_WORKFLOW.md` should gain a concise **Self-Prompting Router** section near the existing task classification table.

For every user request, the Main Agent should:

1. classify the request into a task type,
2. select the corresponding path,
3. identify required gates and verification steps,
4. identify which lenses or sub-agents are required,
5. generate the next internal prompt or handoff prompt from the relevant contract,
6. continue only when the path's current gate or Done criteria are satisfied.

The existing task table remains the source of truth. The new router section makes clear that the table is not just reference material; it is the controller for the next action.

## 6. Prompt Contracts and Handoff Templates

Add a reusable handoff template document in both languages:

- `templates/docs/en/HANDOFF_TEMPLATES.md`
- `templates/docs/vi/HANDOFF_TEMPLATES.md`

The document should define compact prompt skeletons for the common workflow handoffs. Each template should use the same structure:

```text
Role:
Goal:
Inputs:
Required context:
Constraints:
Output format:
Done criteria:
```

Recommended templates:

1. **BA Discovery Prompt**
   - Used for Full path feature discovery.
   - Converts a vague idea into scope, assumptions, acceptance criteria, and open questions.
   - Must not propose implementation before requirements are clear.

2. **Architect Planning Prompt**
   - Used for Standard and Full path planning.
   - Explores architecture, assesses impact, locks interfaces, identifies risks, and prepares an implementation plan.
   - Must not edit code before the required gate.

3. **Implementer Prompt**
   - Used when a plan has decomposed work into bounded tasks.
   - Implements only the assigned task, follows TDD when required, reports status and evidence.
   - Must not broaden scope or refactor unrelated areas.

4. **Spec Compliance Reviewer Prompt**
   - Checks whether implementation matches the approved spec or plan.
   - Focuses on missing requirements, extra behavior, and ambiguity resolution.

5. **Code Quality Reviewer Prompt**
   - Reviews correctness, simplicity, reuse, maintainability, and efficiency.
   - Avoids style-only churn unless it affects clarity or reliability.

6. **QA / Security Reviewer Prompt**
   - Tries to break the implementation.
   - Checks path-specific DoD, security-sensitive surfaces, regression risks, and verification evidence.

7. **Brownfield Discovery Prompt**
   - Used before risky first changes in old codebases.
   - Separates evidence from assumptions and identifies areas needing human confirmation.

8. **Handover / Retro Prompt**
   - Used at completion.
   - Summarizes what changed, verification evidence, remaining risks, and the lightweight retro.

## 7. Role library behavior

`TEAM_ROSTER.md` should be expanded from a general persona list into a conditional role library.

Roles should remain lenses, not always-on agents:

- **BA lens** activates during discovery, PRD, assumptions, and acceptance criteria work.
- **Architect lens** activates during impact analysis, planning, interface contracts, and risk assessment.
- **Developer lens** activates during implementation tasks.
- **QA lens** activates before completion for Standard and Full paths, and optionally for Fast path work.
- **Security lens** activates when the task touches authentication, permissions, user input, secrets, external integrations, deployment, AI behavior, or other sensitive surfaces.
- **Design lens** activates for UI/UX work and must follow the design standards.
- **Scrum Master lens** activates for state updates, artifact links, handoff, and retro.

This gives the framework the benefits of an AI agency without forcing every request through every role.

## 8. Delegate-or-direct rules

Add explicit delegation guidance to each path:

- **Read-only:** answer directly; delegate only for broad exploration that would exceed a few searches.
- **Fast:** Main Agent usually acts directly; review is optional unless the task escalates.
- **Standard:** planning gate and impact analysis are required; review sub-agent is required before completion; implementation delegation is optional.
- **Full:** phase-based workflow; use BA and Architect lenses for gates; use implementation sub-agents only for independent tracks or context isolation; QA/review is required.
- **Timeboxed Spike:** may fan out research agents; output is a recommendation, not mergeable POC code.
- **Brownfield first change:** if the discovery document exists and the change crosses the configured risk threshold, escalate to Standard.

These rules prevent the framework from equating self-prompting with unnecessary multi-agent fan-out.

## 9. Next-prompt decision table

Add a decision table that tells the Main Agent what prompt to generate next based on workflow state.

| Current state | Next prompt/action |
|---|---|
| Request unclear | Ask one clarifying question using the communication protocol. |
| Task classified as Q&A | Answer read-only with cited evidence. |
| Task classified as chore/docs/config | Use Fast path and verify relevant docs/build checks. |
| Localized bugfix | Trigger systematic debugging and write a repro test before fixing. |
| Existing behavior change | Enter Standard path, run impact analysis, prepare plan gate. |
| Refactor | Enter Standard path, run impact analysis, preserve behavior, avoid manual rename. |
| New feature idea | Generate BA Discovery Prompt and produce PRD/scope artifact. |
| PRD approved | Generate Architect Planning Prompt and produce technical plan. |
| Plan approved | Generate bounded implementer prompt or act directly if delegation is not useful. |
| Implementation done | Generate spec compliance and code quality review prompts. |
| Sensitive surface touched | Generate QA/Security Reviewer Prompt. |
| Review failed | Generate focused fix prompt using reviewer findings. |
| Verification passed | Generate handover/retro prompt and update state/artifacts. |
| Unexpected risk discovered | Stop, report risk, and request the required gate or user decision. |

## 10. Documentation changes

Primary template changes:

- `templates/docs/en/AGENCY_WORKFLOW.md`
- `templates/docs/vi/AGENCY_WORKFLOW.md`
- `templates/docs/en/TEAM_ROSTER.md`
- `templates/docs/vi/TEAM_ROSTER.md`
- `templates/docs/en/HANDOFF_TEMPLATES.md`
- `templates/docs/vi/HANDOFF_TEMPLATES.md`

Secondary changes may include:

- Link `HANDOFF_TEMPLATES.md` from the related documents table in `AGENCY_WORKFLOW.md`.
- Link `HANDOFF_TEMPLATES.md` from `TEAM_ROSTER.md` where sub-agent prompt contracts are described.
- Update template link integrity tests if they require enumerating known docs.
- Update generated package contents if tests verify installed template files.

## 11. Out of scope

This phase should not add:

- a new orchestrator app,
- a custom agent runtime,
- a new MCP server,
- Google Cloud deployment automation,
- mandatory Product Manager, Analytics, or Cloud agents,
- automatic deploy or CI/CD actions,
- runtime dependencies,
- redistribution of non-permissive third-party skills.

Those can be separate phases after the process-first layer is stable.

## 12. Success criteria

After this design is implemented, a consumer project initialized by `hero-vibe-kit` should give Claude enough guidance to determine:

- which workflow path applies,
- which lens or sub-agent is required,
- how to construct the next internal or handoff prompt,
- when to ask the user a blocking question,
- when to enter Plan Mode,
- when to run review or verification,
- when to update state and artifacts,
- when it is safe to claim completion.

The user should not need to prompt each role manually. The framework should make the next prompt a consequence of task type, workflow state, and Done criteria.

## 13. Implementation notes

Implementation should be documentation-first and test-backed:

1. Update English templates first.
2. Mirror Vietnamese templates with equivalent structure and meaning.
3. Keep the new sections concise enough to be operational during real Claude Code sessions.
4. Avoid copying large blocks across multiple docs; link to `HANDOFF_TEMPLATES.md` where possible.
5. Run the repository's doc/link/template tests.
6. Run `gitnexus_detect_changes()` before any commit, if a commit is requested later.

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Framework becomes too ceremonial | Keep delegate-or-direct rules explicit and preserve Fast path behavior. |
| Users misunderstand self-prompting as full autonomy | Keep gates, verification, and user approval rules prominent. |
| Docs duplicate each other | Make `AGENCY_WORKFLOW.md` the router, `TEAM_ROSTER.md` the role library, and `HANDOFF_TEMPLATES.md` the prompt contract library. |
| Sub-agent prompts become too verbose | Use compact templates and require only task-relevant context. |
| Bilingual drift | Update EN/VI files in the same implementation task and run link parity tests. |

## 15. Implementation decisions

1. `HANDOFF_TEMPLATES.md` should be listed as a related document in `AGENCY_WORKFLOW.md` and referenced from the path sections only where a handoff is required.
2. The full next-prompt decision table should live in `AGENCY_WORKFLOW.md` because it governs routing. `HANDOFF_TEMPLATES.md` should contain prompt skeletons, not duplicate routing policy.
3. Vietnamese templates should use Vietnamese role labels followed by the stable English role in parentheses, such as `Phân tích nghiệp vụ (BA)` and `Kiến trúc sư hệ thống (Architect)`, so prompts remain readable while preserving consistent role names across languages.
