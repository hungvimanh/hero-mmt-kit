---
name: hero-security
description: Use when you want an independent OWASP + AI/LLM security review or release gate of changed code, plans, configuration, or sensitive surfaces
---

# Hero Security

## Overview

hero-security is a standalone security engineering and review skill. It is not part of `hero-coding` or `hero-reviewing`, and it does not wrap another security skill. Invoke it directly when a developer wants an adversarial security pass over a plan, implementation, configuration, diff, release candidate, or security-sensitive system design.

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

Apply only relevant control domains to keep context focused:
- Always include domains 1, 2, 3, 4, 5, 6, 7, 9, 10, and 11 below.
- Include domain 8 only if file upload or file processing exists.
- Include domains 12 and 13 only if AI-assisted coding, AI runtime features, RAG, prompt construction, model APIs, or tool-calling agents exist.
- Include domain 14 only if an Android/iOS mobile app exists.
- For admin, internal, privileged, and service accounts, enforce stricter credential, MFA, lockout, lifecycle, rotation, and audit controls than customer accounts.
- For internet-facing or multi-tenant systems, treat access control, rate limiting, tenant isolation, audit logging, and least-data responses as release-gate controls.

## Security Control Baseline

Use this baseline to classify controls as **Required**, **Missing**, **Verified**, **Not applicable**, or **Not reviewed**.

### 1) Input Handling and Data Processing

Required:
- Validate all client input at the server boundary: type, length, range, format, regex, and allow-list where possible.
- Never trust client data, including hidden fields, UI state, and client-side validation results.
- Encode or escape data before use in HTML, JS, CSS, SQL, LDAP, template, shell, and log contexts.
- Prefer allow-list validation over deny-list validation.

Verification:
- Negative tests cover malformed, oversized, unexpected-type, and boundary input.
- No dynamic query, template, shell, or expression injection path accepts raw input.

### 2) Authentication and Accounts

Required:
- Use established standards such as SSO, OAuth2, or OIDC where possible.
- Store passwords only with salted bcrypt, Argon2, or scrypt; never plaintext or reversible encryption.
- Do not hardcode credentials or secrets in source code, config, generated examples, logs, or repository history.
- Require MFA for privileged/admin accounts.
- Enforce first-login password change for internal or privileged accounts when password login exists.
- Privileged/internal credential rotation should be at most 90 days, and privileged/admin accounts cannot reuse the last 5 passwords.
- Privileged/service account credentials must be strong random values protected by a secret manager.
- Lockout policy: internal/admin accounts lock after 6 failed attempts in 15 minutes; customer accounts use progressive delay and captcha or equivalent abuse protection.
- Password policy: internal/admin minimum 12 characters, privileged minimum 14 with upper/lower/digit/special; customer minimum 8 and recommended 10+ with strength checks and 2FA capability.

Verification:
- Tests cover lockout, MFA path, password reuse, rotation, and generic auth failure behavior.

### 3) Session Management

Required:
- Session IDs must be cryptographically random and high entropy.
- Cookies must set `Secure`, `HttpOnly`, and `SameSite=Strict` or `SameSite=Lax`.
- Session invalidation must occur server-side on logout, privilege changes, and credential reset.
- Centralize auth/session controls in shared middleware or a shared library.
- Enforce inactivity timeout according to risk level; 15 minutes or less is recommended for sensitive/admin flows.
- Never send session IDs, access tokens, or refresh tokens through URLs or logs.

Verification:
- Evidence confirms server-side revocation, timeout behavior, cookie flags, and no token leakage in URLs/logs.

### 4) Access Control

Required:
- Enforce authorization server-side only; UI controls are never security controls.
- Deny by default and grant only required permissions.
- Apply least privilege and role separation across user, admin, privileged, and service accounts.
- No shared privileged accounts.
- Never create a default super admin during bootstrap.
- Privileged account lifecycle must be approved, time-bounded, logged, and promptly revoked.
- Multi-tenant systems must enforce tenant isolation on every object read, write, export, webhook, background job, and admin path.

Verification:
- Tests cover horizontal and vertical privilege escalation, direct object references, tenant leaks, and sensitive action authorization.

### 5) Cryptography and Data Protection

Required:
- Use standard algorithms and maintained libraries only, such as AES-256, RSA-2048+, or ECC where appropriate.
- Never create custom cryptographic algorithms or ad-hoc signing/encryption formats.
- Manage keys in Vault or a Secret Manager with rotation policy and scoped access.
- Protect data stored on web/mobile clients: minimize retention, delete when unnecessary, encrypt or mask sensitive data.
- Store mobile credentials/secrets only in OS secure stores such as Keychain or Keystore.
- Never store auth tokens in `localStorage` or `sessionStorage`; use HttpOnly cookies or secure ephemeral memory.
- Protect sensitive data at rest and in transit according to classification.

Verification:
- Evidence exists for key source, key access scope, rotation, TLS, encrypted backups, and sensitive data minimization.

### 6) Error Handling and Logging

Required:
- Return generic authentication errors; do not reveal user existence or exact failure reason.
- Log critical security events: login, logout, failed login, MFA changes, permission changes, credential resets, exports, and sensitive create/update/delete actions.
- Use structured logs such as JSON or syslog-compatible records.
- Do not expose stack traces, system paths, versions, or internal error details to end users.
- Never log passwords, secrets, tokens, session IDs, prompt contents containing sensitive data, or sensitive PII.
- Audit important business actions with actor, timestamp, source IP, action, target object, and result.
- Applications must not be able to modify or delete their own immutable security logs.

Verification:
- Sampling confirms logs are structured, useful for audit, and free of sensitive fields.

### 7) Database Security

Required:
- Use prepared statements or safe ORM patterns; no string concatenation SQL or dynamic query construction from raw input.
- Database accounts must follow least privilege; applications must not use root, `sa`, owner, or broad admin accounts.
- Enable audit logging for sensitive tables and sensitive actions such as CREATE, DROP, ALTER, UPDATE, DELETE, and INSERT, then forward to SIEM or equivalent monitoring.
- Encrypted backups are mandatory for sensitive systems.
- Sensitive columns or tables must be encrypted or tokenized where classification requires it.
- AI internal apps must have scoped DB/knowledge access, dedicated service accounts, and access logging.
- Each service can access only its own database; avoid cross-service shared DB accounts.

Verification:
- Review grants, SQL patterns, audit pipeline, backup encryption, and service account scope.

### 8) File Handling and Upload

Required when upload or file processing exists:
- Validate MIME type, extension, and magic number.
- Store uploaded files outside webroot or outside direct executable/static serving paths.
- Integrate malware scanning or sandboxing where applicable.
- Enforce file size, count, and processing time limits.
- Block executable uploads such as `.php`, `.jsp`, `.exe`, scripts, and dangerous archive formats unless explicitly justified and sandboxed.
- Generate non-predictable server-side filenames; never trust user-provided names or paths.
- Prevent path traversal, archive slip, symlink traversal, parser confusion, and polyglot bypasses.

Verification:
- Tests include renamed executable, polyglot file, oversized file, archive traversal, MIME mismatch, and path traversal attempts.

### 9) Communication and API Security

Required:
- Expose only necessary APIs and maintain clear documentation.
- Rotate API keys and tokens periodically.
- Apply rate limiting and anti-bruteforce controls for APIs, login endpoints, password reset, MFA, exports, and expensive operations.
- Never send access tokens or secrets in URLs.
- Do not expose version banners, software details, stack traces, or debug data in responses.
- Use explicit API versioning; do not silently break previous behavior.
- Return minimum required fields only; avoid over-fetching full objects.
- Validate webhook signatures and replay protections.

Verification:
- Contract tests confirm response field minimization, authz, rate limits, version behavior, and webhook signature checks.

### 10) Configuration Security

Required:
- Allow only necessary HTTP methods.
- Enable security headers such as CSP, X-Frame-Options or frame-ancestors, X-Content-Type-Options, Referrer-Policy, and HSTS where applicable.
- Do not commit `.env`, credentials, private keys, production config, or local secret dumps.
- Do not use default usernames, passwords, demo tenants, permissive CORS, debug mode, broad IAM policies, or public buckets in production.
- Separate dev/test/prod configuration and fail closed on missing security-critical settings.

Verification:
- Config scan confirms methods, headers, environment separation, CORS, IAM, storage, and debug settings are enforced in all environments.

### 11) Dependencies and Supply Chain

Required:
- Use package manager lockfiles for deterministic dependency trees.
- Run SCA and generate or maintain an SBOM where required.
- Use trusted and maintained libraries only, with approval before adopting risky or security-sensitive dependencies.
- Enforce pre-commit or CI hooks for SAST and SCA where project policy requires them.
- Apply approved security patches promptly.
- Do not use end-of-life libraries, unpinned install scripts, unsafe postinstall behavior, or unreviewed vendored code.

Verification:
- CI gate fails on critical vulnerabilities, missing lockfile/SBOM, known malicious packages, or unsupported runtime/dependency versions.

### 12) AI-Assisted Coding Security

Required when AI coding tools are used:
- Never share source code, customer data, internal configs, secrets, or API keys with unapproved public AI tools.
- Use only approved AI tools with appropriate data-protection settings.
- Developers remain responsible for AI-generated code correctness, licensing, and security.
- AI-generated code must pass SAST/SCA and secure coding checks before commit.
- Explicitly verify high-risk classes: hardcoded secrets, SQL injection, XSS, unsafe deserialization, command injection, path traversal, authz bypass, tenant leaks, and insecure crypto.
- Validate AI suggestions against official documentation and security best practices.
- Track origin notes for complex/high-impact AI-generated code when required for audit.
- Ensure AI-generated code and snippets do not violate license or copyright constraints.

Verification:
- Review sample commits for AI-origin controls, scan evidence, and human verification of high-risk generated code.

### 13) AI System Security

Required when shipping AI runtime features:
- Verify data and model integrity with hashes, signatures, provenance, or trusted deployment channels before training/deployment.
- Detect and mitigate data poisoning through anomaly checks and source validation.
- Restrict, encrypt, and control access to training, evaluation, prompt, and retrieval data.
- Rate-limit model APIs to reduce extraction, abuse, and cost-exhaustion risk.
- Sanitize user input and external content against direct and indirect prompt injection, including retrieved context.
- Do not send sensitive data to AI prompts without classification and approval.
- Never rely on system prompts as the only security control.
- Do not hardcode secrets, hidden policy, or business logic in prompts.
- Enforce tenant isolation for AI context, vector stores, tools, memory, logs, and sessions.
- Validate and filter AI outputs before rendering, execution, query building, workflow decisions, or downstream use.
- Never pass AI output directly into SQL, shell, code execution, browser automation, emails, payments, or destructive operations.
- Require human confirmation for irreversible, external, privileged, or high-risk actions.
- Handle AI timeout, refusal, hallucination, malformed, or invalid outputs safely without exposing internal errors.
- If tool-calling agents are enabled: enforce least privilege, allowlisted tools, confirmation on real-world actions, max-step limits, and audit logs.
- Log and monitor model behavior anomalies while excluding sensitive data and defining retention.
- Reassess risk whenever model, provider, retrieval source, tool set, or prompt policy changes.

Verification:
- Red-team prompt-injection, data-exfiltration, tenant-isolation, tool-abuse, and unsafe-output test cases are included.

### 14) Mobile Application Security

Required when Android/iOS mobile apps exist:
- Detect root on Android or jailbreak on iOS and apply a risk response such as warn, restrict, or deny.
- Detect emulator execution and apply appropriate mitigations for sensitive operations.
- Implement app integrity verification to detect tampering and repackaging.
- Run runtime security checks at startup, resume, and before sensitive operations.
- Enable release obfuscation.
- Sign release APK/IPA with production keystore/certificate only; never use debug keys.
- Store credentials and tokens only in OS secure storage, and minimize local sensitive data retention.

Verification:
- Release checklist includes integrity, signing, obfuscation, secure storage, runtime-defense checks, and sensitive-flow testing.

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
- Missing human approval for irreversible, external, privileged, or high-risk actions.

### Common implementation hazards

Check input validation, path traversal, upload handling, redirects, CORS/CSRF, XSS, dependency scripts, environment variable handling, logs, error messages, default-deny behavior, secret handling, API response minimization, rate limits, database grants, secure headers, mobile secure storage, and tool-calling boundaries.

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
11. Write a standalone security report with a verdict: Pass / Pass with follow-ups / Blocked.
12. If any Critical/High findings exist, they must be fixed or explicitly accepted with a documented reason before the work is considered done.

Do not run exploitative tests against external systems. Do not recommend detection evasion, persistence, destructive actions, destructive payloads, denial-of-service, credential theft, supply-chain compromise, or broad targeting.

## Release Gate

Block release when any of the following is true:
- Missing server-side authorization checks for sensitive actions.
- Missing input validation for external inputs.
- Secrets, credentials, tokens, private keys, or regulated data exposed in code, logs, prompts, repository, artifacts, URLs, or client storage.
- SQL/NoSQL/command/template injection path exists due to dynamic concatenation or unsafe interpolation.
- No MFA for privileged/admin accounts.
- No rate limiting or anti-bruteforce control on auth-sensitive endpoints.
- Critical dependency, runtime, image, or infrastructure vulnerability remains unresolved without documented acceptance.
- Tenant isolation is unverified for multi-tenant sensitive data.
- AI/tool-calling feature can perform irreversible, external, privileged, or high-risk action without confirmation and least privilege.
- File upload accepts executable, oversized, path-traversal, or parser-confusion payloads without effective controls.

## Output Artifact

`docs/security-reports/YYYY-MM-DD-<slug>.md` — a standalone security review report.

Use this format:

```markdown
# Security Review: <slug>

## Scope reviewed
- Files / modules:
- Endpoints / services / clients:
- Data class and exposure:
- Account types and identity model:
- Artifacts:
- Commands or evidence read:

## Applied domains
- Domain numbers and names:
- Domains not applicable:
- Domains not reviewed:

## Findings
| Severity | Area | Evidence | Exploit path | Risk / impact | Recommendation | Status |
|---|---|---|---|---|---|---|

## Required fixes before release
- ...

## Recommended improvements
- ...

## Verification
- Tests / scans / config checks / log checks performed:
- Missing verification:

## OWASP coverage
- Web Top 10 categories checked:
- AI/LLM categories checked, if applicable:

## Residual risks
- Accepted risk:
- Owner:
- Deadline:

## Not reviewed / uncertainty
- ...

## Verdict
- Pass / Pass with follow-ups / Blocked
- Required fixes before completion:
```

Severity guide:
- **Critical:** likely unauthorized access, data loss/exfiltration, RCE, secret exposure, supply-chain compromise, payment compromise, or tenant isolation break.
- **High:** exploitable sensitive action/data risk, missing core authz/authn control, unsafe privileged/tool action, or realistic injection path.
- **Medium:** realistic abuse path with limited impact or defense-in-depth gap on a sensitive surface.
- **Low:** hardening, clarity, logging, monitoring, or low-impact misconfiguration.

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

- Standalone security report is saved at the artifact path above.
- Every finding has severity, evidence, exploit path, risk/impact, recommendation, and status.
- Relevant baseline domains are marked Verified, Missing, Not applicable, or Not reviewed.
- No unresolved Critical/High findings remain: each is either fixed or explicitly accepted with owner, reason, and deadline.
- Release-gate blockers are resolved before Pass.
- The report lists any missing inputs, missing verification, residual risks, or unreviewed surfaces.

## ACTIVE_STATE.md Update

- If a finding blocks the work, add it to the Blockers/Pending Actions section of `docs/ACTIVE_STATE.md`.
- Write `.hero-mmt-kit/session.json` with `currentSkill: "hero-security"`, `resumePath` pointing at the security report, `nextAction` set to the required fix/follow-up or `"proceed"`, and `updatedAt` as an ISO timestamp.

## Related Skills

- Independent of `hero-coding` and `hero-reviewing`; those skills may recommend this security pass but do not invoke it as a wrapper.
- Complements `hero-strict`: strict verification can flag that this security review is still missing, but `hero-security` owns the security report and verdict.
