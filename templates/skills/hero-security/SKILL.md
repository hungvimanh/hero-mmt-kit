---
name: hero-security
description: Use when you want an independent OWASP + AI/LLM security review or release gate of changed code, plans, configuration, or sensitive surfaces
---

# Hero Security

## Overview

hero-security is a standalone security review skill. It is not part of `hero-coding` or `hero-reviewing`, and it does not wrap another security skill. Invoke it directly when a developer wants an adversarial security pass over a plan, implementation, configuration, diff, release candidate, or security-sensitive system design.

**Core principle:** inspect attack surfaces explicitly, map controls to the reviewed scope, report uncertainty honestly, and never claim a surface is safe if it was not reviewed.

## Outcome

Produce a security output that is actionable and auditable:
- Risk-ranked findings or required controls mapped to the reviewed scope.
- Required controls versus recommended hardening.
- Verification checklist with pass/fail criteria.
- Residual risks, owners, and follow-up actions.
- A release verdict when the review is used as a gate.

## When to Use

Use this skill when:
- The user explicitly asks for security, OWASP, compliance, abuse-case, hardening, threat modeling, vulnerability review, remediation planning, or release-gate review.
- The task touches authentication, authorization, auth/authz boundaries, sessions, secrets, payments, personal data, regulated data, tenant isolation, uploads, file paths, network calls, webhooks, permissions, deployment, infrastructure, mobile apps, database access, API exposure, dependency changes, or supply-chain behavior.
- `gitnexus_impact` or project policy marks the change as HIGH/CRITICAL or security-sensitive.
- A Full path feature reaches QA or pre-merge review.
- The feature includes AI/assistant behavior, AI-assisted coding, AI runtime features, tool use, retrieval/RAG, prompt construction, generated code, or user-supplied instructions.

This skill is intentionally independent: `hero-coding`, `hero-reviewing`, and `hero-strict` may recommend running it, but they do not own or embed the security pass.

## Inputs

Read artifact-first:
1. Planning artifact / PRD / technical design, if present.
2. Execution handoff, coding report, or implementation summary, if present.
3. The current diff and relevant changed files.
4. `docs/SECURITY_STANDARDS.md` and any existing threat model or project conventions.
5. Test/build/security-tool evidence that already exists.
6. System scope: feature, endpoints, services, clients, data stores, background jobs, and admin/internal surfaces.
7. Stack: language, framework, database, infrastructure, identity provider, and deployment model.
8. Data class: public, internal, sensitive, regulated, secrets, credentials, tokens, or tenant data.
9. Exposure: internal only, partner, internet-facing, mobile, webhook, or model/tool-facing.
10. Identity model and account types: SSO, OAuth2/OIDC, session, API key, customer, employee, admin, privileged, or service account.
11. Optional modules: file upload, file processing, AI, mobile, RAG, tool-calling, payments, exports, or third-party integrations.

If an input is missing, continue with what is available and mark the gap in the report.

## Context Optimization Rules

Apply only relevant control domains to keep context focused (full domain list: @docs/SECURITY_CONTROL_BASELINE.md):
- Always include domains 1, 2, 3, 4, 5, 6, 7, 9, 10, and 11 below.
- Include domain 8 (File Handling and Upload) only if file upload or file processing exists.
- Include domains 12 and 13 (AI-Assisted Coding Security, AI System Security) only if AI-assisted coding, AI runtime features, RAG, prompt construction, model APIs, or tool-calling agents exist.
- Include domain 14 (Mobile Application Security) only if an Android/iOS mobile app exists.
- For admin, internal, privileged, and service accounts, enforce stricter credential, MFA, lockout, lifecycle, rotation, and audit controls than customer accounts.
- For internet-facing or multi-tenant systems, treat access control, rate limiting, tenant isolation, audit logging, and least-data responses as release-gate controls.

## Security Control Baseline

14 domains (Input Handling, Authentication, Session Management, Access Control, Cryptography, Error Handling/Logging, Database Security, File Handling, Communication/API, Configuration, Dependencies/Supply Chain, AI-Assisted Coding Security, AI System Security, Mobile Application Security), each classified as **Required**, **Missing**, **Verified**, **Not applicable**, or **Not reviewed**, with its own Required controls and Verification steps.

Full baseline: @docs/SECURITY_CONTROL_BASELINE.md

## Review Checklist

OWASP Web Top 10 coverage, AI/LLM feature coverage (prompt injection, tool abuse, data leakage), and common implementation hazards to check on every pass, plus the release-gate blocking conditions.

Full checklist and release gate: @docs/SECURITY_REVIEW_CHECKLIST.md

## Process

1. Define the reviewed scope: files, artifacts, changed behavior, endpoints, data classes, account types, configuration, and evidence available.
2. Read `docs/SECURITY_STANDARDS.md` and apply any project-specific policy that matches the reviewed surface.
3. Select relevant security domains using the Context Optimization Rules.
4. Inspect the diff and relevant surrounding code. For code changes, prefer exact file path + line evidence for every finding.
5. Evaluate each relevant required control as Verified, Missing, Not applicable, or Not reviewed.
6. Walk the OWASP Web Top 10 checklist and the AI/LLM checklist when applicable.
7. Separate confirmed findings from hypotheses and explicitly list anything not reviewed.
8. Rank gaps by risk: Critical, High, Medium, Low.
9. Define remediation actions with owner and due date when the user needs an auditable plan.
10. Run or cite verification tests, scans, config checks, and log checks before a release verdict.
11. Write a standalone security report at `docs/security-reports/YYYY-MM-DD-<slug>.md` with a verdict: Pass / Pass with follow-ups / Blocked.
12. State the verdict and report path in chat.
13. If any Critical/High findings exist, they must be fixed or explicitly accepted with a documented reason before the work is considered done.

Do not run exploitative tests against external systems. Do not recommend detection evasion, persistence, destructive actions, destructive payloads, denial-of-service, credential theft, supply-chain compromise, or broad targeting.

## Release Gate

Blocks release on missing server-side authz, missing input validation, exposed secrets/credentials, injection paths, missing MFA on privileged accounts, missing rate limiting on auth-sensitive endpoints, unresolved critical dependency/infra vulnerabilities, unverified tenant isolation, unconfirmed high-risk AI/tool actions, or unsafe file upload handling.

Full blocking conditions: @docs/SECURITY_REVIEW_CHECKLIST.md

## Output Artifact

`docs/security-reports/YYYY-MM-DD-<slug>.md` — a standalone security review report. `hero-security` owns this artifact; do not append its findings into coding/review/test reports as a substitute for the security report.

Report format and severity guide: @docs/SECURITY_REPORT_FORMAT.md

Security finding style:
- Do not over-compress risk explanations.
- Keep severity, affected surface, exploit path, evidence, required fix, owner/deadline when applicable, and verification status explicit.
- Preserve exact endpoints, paths, auth scopes, secret names, headers, API names, commands, file paths, line references, error strings, dependency names, package versions, and configuration keys.
- Concision never outranks safety clarity.
- If no findings are found, say what was reviewed and what remains unreviewed; do not say "secure" without scope.

## Common Anti-Patterns

Flag these explicitly when observed:
- Trusting client-side validation, hidden UI state, or disabled buttons as security controls.
- Relying on system prompts as a security boundary.
- Logging tokens, prompts with sensitive data, or sensitive payloads for debugging.
- Reusing privileged or cross-service DB credentials.
- Returning full entities from APIs instead of least-data responses.
- Storing tokens in `localStorage` or `sessionStorage`.
- Creating default super admins, default credentials, broad IAM roles, or public buckets.
- Passing AI output directly into SQL, shell, browser automation, or irreversible actions.
- Shipping uploads without magic-number validation, malware scanning where needed, or non-predictable server-side filenames.

## Definition of Done

- Every finding has severity, evidence, exploit path, risk/impact, recommendation, and status.
- Relevant baseline domains are marked Verified, Missing, Not applicable, or Not reviewed.
- No unresolved Critical/High findings remain: each is either fixed or explicitly accepted with owner, reason, and deadline.
- Release-gate blockers are resolved before Pass.
- Standalone security report is saved at `docs/security-reports/YYYY-MM-DD-<slug>.md`.
- Findings and verdict are stated in chat with a link/path to the standalone report, noting any missing inputs, missing verification, residual risks, or unreviewed surfaces.

## ACTIVE_STATE.md Update

- If a finding blocks the work, add it to the Blockers/Pending Actions section of `docs/ACTIVE_STATE.md`.

## Related Skills

- Independent of `hero-coding` and `hero-reviewing`; those skills may recommend this security pass but do not invoke it as a wrapper.
- Complements `hero-strict`: strict verification can flag that this security review is still missing.
- Points at `docs/SECURITY_STANDARDS.md` for project-level policy and standards.
- Does not use `hero-report` as a substitute for its own report; security findings belong in `docs/security-reports/...`.

## Knowledge References

All reference knowledge lives alongside `docs/SECURITY_STANDARDS.md` in the project's `docs/` folder:
- @docs/SECURITY_STANDARDS.md — this project's own filled-in security policy (project-specific).
- @docs/SECURITY_CONTROL_BASELINE.md — the 14-domain security control baseline (fixed framework reference).
- @docs/SECURITY_REVIEW_CHECKLIST.md — OWASP/AI-LLM review checklist and release-gate blocking conditions.
- @docs/SECURITY_REPORT_FORMAT.md — the standalone report template and severity guide.
