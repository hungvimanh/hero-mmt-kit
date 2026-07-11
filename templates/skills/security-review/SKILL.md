---
name: security-review
description: Use when reviewing code for security vulnerabilities, OWASP Top 10 risks, sensitive-data exposure, auth/authz mistakes, or AI/LLM safety risks before completion
---

# Security Review

## Overview

Security review is a focused adversarial pass over the plan, implementation, configuration, and changed code. It does not replace tests or code review; it answers: "What could an attacker abuse, and what evidence says this is safe enough?"

**Core principle:** inspect attack surfaces explicitly, report uncertainty honestly, and never claim a surface is safe if it was not reviewed.

## When to Use

Use this skill when:
- The task touches authentication, authorization, sessions, secrets, payments, personal data, tenant isolation, uploads, file paths, network calls, webhooks, permissions, deployment, or infrastructure.
- A Full path feature reaches QA.
- `gitnexus_impact` or project policy marks the change as HIGH/CRITICAL or security-sensitive.
- The user asks for security, OWASP, compliance, abuse-case, or vulnerability review.
- The feature includes AI/assistant behavior, tool use, retrieval, prompt construction, generated code, or user-supplied instructions.

## Inputs

Read artifact-first:
1. Planning artifact / PRD / technical design.
2. Execution handoff or implementation summary.
3. The current diff and relevant changed files.
4. Existing security standards, threat model, and project conventions.
5. Test/build evidence that already exists.

If an input is missing, continue with what is available and mark the gap in the report.

## Review Checklist

### OWASP Web Top 10 coverage

Check for:
- Broken access control: missing ownership checks, tenant leaks, unsafe direct object references, privilege escalation.
- Cryptographic failures: secrets in code/logs, weak token handling, sensitive data exposure, unsafe storage or transport.
- Injection: SQL/NoSQL/LDAP/template/command injection, unsafe shell execution, untrusted interpolation.
- Insecure design: missing abuse-case handling, unsafe trust boundaries, rate-limit gaps, missing approval gates.
- Security misconfiguration: permissive CORS, debug modes, unsafe headers, default credentials, broad permissions.
- Vulnerable/outdated components: risky dependency/config changes, unreviewed generated code or vendored code.
- Identification/authentication failures: weak session lifecycle, token refresh/logout mistakes, replay risks.
- Software/data integrity failures: unsafe deserialization, unchecked downloads, supply-chain assumptions, unsigned updates.
- Logging/monitoring failures: missing audit trails for sensitive actions, leaked secrets/PII in logs.
- SSRF and unsafe outbound access: user-controlled URLs, metadata service access, webhook fetches, redirects.

### AI / LLM feature coverage

When AI or assistant behavior is touched, also check:
- Prompt injection and tool-instruction boundary failures.
- Unauthorized tool use or data access through model-controlled paths.
- Sensitive prompt/context leakage.
- Retrieval/data poisoning assumptions.
- Unsafe generated code, command suggestions, or policy bypasses.
- Missing human approval for irreversible, external, or high-risk actions.

### Common implementation hazards

Check input validation, path traversal, upload handling, redirects, CORS/CSRF, XSS, dependency scripts, environment variable handling, logs, error messages, and default-deny behavior.

## Output Format

Write a concise report with:

```markdown
# Security Review

## Scope reviewed
- Files / modules:
- Artifacts:
- Commands or evidence read:

## Findings
| Severity | Area | Evidence | Risk | Recommendation | Status |
|---|---|---|---|---|---|

## OWASP coverage
- Web Top 10 categories checked:
- AI/LLM categories checked, if applicable:

## Not reviewed / uncertainty
- ...

## Verdict
- Pass / Pass with follow-ups / Blocked
- Required fixes before completion:
```

Severity guide:
- **Critical:** likely unauthorized access, data loss/exfiltration, RCE, secret exposure, or tenant isolation break.
- **High:** exploitable sensitive action/data risk or missing core authz/authn control.
- **Medium:** realistic abuse path with limited impact or defense-in-depth gap on sensitive surface.
- **Low:** hardening, clarity, logging, or low-impact misconfiguration.

## Rules

- Cite exact file paths and line numbers where possible.
- Separate confirmed issues from hypotheses.
- Do not run exploitative tests against external systems.
- Do not recommend detection evasion, persistence, destructive actions, or broad targeting.
- If no findings are found, say what was reviewed and what remains unreviewed; do not say "secure" without scope.
