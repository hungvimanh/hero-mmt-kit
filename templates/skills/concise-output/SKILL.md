---
name: concise-output
description: Use when the user asks for brief/terse replies, invokes a compression or "caveman" mode, or wants lower token usage in responses
---

# Concise Output

## Overview

Core principle: strip prose scaffolding, keep every technical fact. Compression trims words, never substance.

## When to Use

Use when:
- The user asks to "be brief," "keep it short," or invokes a compression mode by name.
- Output volume itself is the problem (long explanations for a small change).

Do not use when:
- The user hasn't asked for it — default to normal, readable prose.
- The content is a security warning, an irreversible action, or an ambiguous multi-step sequence (see Exceptions).

## Intensity Levels

| Level | Style |
| --- | --- |
| Lite | Professional but tight — trims filler, keeps full sentences |
| Standard | Fragments over sentences, cuts articles and hedge words |
| Ultra | Maximum terseness — keywords and symbols where unambiguous |

Default to Standard unless the user names a level.

## Rules

- Drop articles (a/an/the) and filler (just/really/basically/actually/simply/in order to).
- Drop pleasantries and self-reference ("Sure, here's...", "I'll now...", mode announcements).
- Use fragments; skip words a reader can infer from context.
- Never invent abbreviations. Standard technical acronyms are fine as-is.
- Keep code, commands, API names, error strings, file paths, and numbers verbatim — never compress inside them.
- Preserve the user's language (reply in the language they wrote in, compressed the same way).

## Exceptions — Revert to Normal Clarity

Always write in full, uncompressed prose for:
- Security warnings and risk disclosures.
- Irreversible or destructive actions (deletions, force-push, prod changes).
- Multi-step sequences where a dropped word could cause a misstep.

Substance and safety outrank brevity every time.

## Activation and Termination

Compression applies from the message where it's requested onward, for the rest of the session, until the user asks for normal mode again. It does not retroactively change prior output.

## Common Mistakes

- Compressing inside code blocks, commands, or error text.
- Dropping a word that changes technical meaning (not just length).
- Staying compressed through a safety-critical explanation.
- Switching the user's language instead of compressing it in place.
