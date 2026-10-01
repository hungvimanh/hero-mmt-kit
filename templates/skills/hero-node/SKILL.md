---
name: hero-node
description: Use for implementation-only Node.js JavaScript or TypeScript service, CLI, worker, or library changes under an approved plan, bounded request, or exact user-approved review corrections
---

# Hero Node

## Scope and Mandatory Parent

hero-node specializes `hero-coding` within the same coding stage; it is not a new stage. Choose it instead of generic `hero-coding` for Node.js services, CLIs, workers, and libraries. The user does not need to invoke both. A frontend project does not qualify merely because it uses Node-based package tooling.

**Before any production edit, read the complete actual sibling [`../hero-coding/SKILL.md`](../hero-coding/SKILL.md), resolved from this skill's installed directory.** Do not substitute a remembered contract, repository template, or metadata declaration for that read. If the sibling is missing or unreadable, stop and report the missing prerequisite; do not reconstruct it.

Inherit the entire parent contract by reference, including approvals, inputs, scope, ledgers, dependencies, blockers, implementation-only boundaries, completion criteria, durable state, handoff, and reporting. The rules below add Node-specific implementation conventions; they do not weaken the parent.

<HARD-BOUNDARY>
Implement only an approved plan explicitly started by the user, a sufficiently bounded request, or exact correction IDs confirmed by prior independent `hero-reviewing` and explicitly approved by the user. Do not choose feedback or expand scope. No test authoring/running, verification commands, self-review, review delegation, deployment, release, or Git delivery actions. Assurance and delivery belong to separate later sessions.
</HARD-BOUNDARY>

Maintain the parent's linked task/requirement ledger, respect dependencies, and keep the approved plan immutable. Record deviations and blockers; stop for ambiguity, missing prerequisites, target drift, or unsafe scope expansion. Reconcile implementation coverage, not correctness. Finish with the parent handoff to independent testing and review.

## MUST: Bounded Changes

Apply these conventions to new code and portions genuinely necessary for the approved change. Do not mechanically convert untouched code to these conventions.

- Preserve the existing framework, module system, supported runtime, and project architecture.
- Do not add unrelated refactors, configuration changes, formatting churn, dependencies, or migrations. Do not convert JavaScript to TypeScript just to satisfy this skill.
- If requirements, framework constraints, or required behavior conflict with a rule here, stop and escalate with the concrete conflict. Do not silently exempt the framework or change semantics.

## MUST: Explicit Conditions and Conversions

- Compare boolean values explicitly with `=== true` or `=== false`, including predicate results in branches, guards, loops, and ternaries.
- Do not use unary `!` or `!!`. Strict inequality `!==` remains valid; it is not unary negation.
- Check the actual business condition rather than truthiness. Distinguish `undefined`, `null`, an empty string, an empty collection, zero, and `false` where the contract distinguishes them.
- Do not invent rejection rules: an empty string or zero may be valid. Check only what the approved requirements demand.
- Use strict equality/inequality (`===`, `!==`), not coercive equality (`==`, `!=`).
- Convert types explicitly, then validate the result against the required domain. Conversion alone is not validation; `Number("")` becoming zero does not establish valid input.
- Preserve nullable and nonboolean semantics. Never mechanically replace `!value` with `value === false`: the original also matches other falsy values. Establish the required cases first; stop if they are ambiguous.

Avoid:

```ts
if (!isAuthorized) return;
if (items.some(isExpired)) reject();
const enabled = !!input;
if (!quantity) reject();
```

Use explicit conditions when these rules are required:

```ts
if (isAuthorized === false) {
  return;
}
if (items.some(isExpired) === true) {
  reject();
}
if (quantity === undefined) {
  throw new Error("Quantity is required");
}
```

For an optional boolean whose contract says only explicit `true` enables work, preserve all disabled cases:

```ts
if (enabled === undefined || enabled === null || enabled === false) {
  return;
}
startWork();
```

This example assumes `enabled` is already narrowed to `boolean | null | undefined`; unknown external input needs validation first.

## MUST: Readable Data and Control Flow

- Write ordinary, explicit statements. Avoid clever shorthand, coercion tricks, compressed chains, and short-circuit side effects such as `ready && publish()`.
- Map data field by field. Do not use bulk copying/mapping to hide which fields cross a boundary; explicit per-field assignments inside a collection's `.map()` are fine.
- Do not use object, array, or call spread when a clearer explicit alternative exists. Do not replace spread with `Object.assign`, reflective key loops, or another implicit bulk-copy workaround. See the narrow compatibility exception below.
- A ternary may have only one simple condition and two simple value branches. No nesting, compound conditions, calls with side effects, or assignment effects. Use `if`/`else` otherwise.
- Respect the existing formatter and surrounding style. Do not impose arbitrary line wrapping, one-line compression, or file-wide reformatting.

Avoid:

```ts
ready && publish();
const label = ready && permitted ? "run" : failed ? "retry" : "wait";
const dto = { ...input };
```

Prefer:

```ts
if (ready === true) {
  publish();
}
const label = ready === true ? "run" : "wait";
```

## MUST: Owned Models and Boundary Validation

Do not use `any` or arbitrary dynamic properties anywhere in new or necessarily changed TypeScript code. Use `unknown` with narrowing for untrusted values; the allowed internal and library shapes below are not an escape hatch for untyped data.

For project-owned TypeScript domain entities and DTOs:

- Use classes with explicitly declared fields and complete constructor assignments. Map each field intentionally; do not use constructor parameter properties.
- Do not use `any`, arbitrary dynamic properties, non-null assertions, definite-assignment assertions, or casts pretending to initialize or validate data.
- Treat external JSON as untrusted runtime data. A class constructor or TypeScript annotation does not validate it. Validate/narrow input before constructing a model, or implement the required runtime guards explicitly in the constructor.
- Preserve the approved validation and serialization contracts. Do not assume a class instance is interchangeable with the framework's required wire representation.

Avoid:

```ts
class JobDto {
  id!: string;
  constructor(input: any) {
    Object.assign(this, input);
  }
}
```

Use explicit fields and constructor mapping:

```ts
class JobDto {
  readonly id: string;
  readonly enabled: boolean;

  constructor(id: string, enabled: boolean) {
    this.id = id;
    this.enabled = enabled;
  }
}

function parseJob(input: unknown): JobDto {
  if (typeof input !== "object" || input === null) {
    throw new Error("Job must be an object");
  }
  if (("id" in input) === false || typeof input.id !== "string") {
    throw new Error("Job id must be a string");
  }
  if (("enabled" in input) === false || typeof input.enabled !== "boolean") {
    throw new Error("Job enabled must be a boolean");
  }
  return new JobDto(input.id, input.enabled);
}
```

This example requires only string/boolean fields; it does not invent nonempty-ID rules. Add other domain validation only when the approved contract requires it. The runtime checks, not the class declaration, establish the external input's shape.

In JavaScript, use equivalent explicit class fields, constructor assignments, mapping, and runtime guards. Do not claim TypeScript's static guarantees or force a language migration. Stay within the project's supported JavaScript syntax; escalate an incompatibility rather than silently weakening the rule.

## PREFER: Cohesion and Safe Early Returns

- Prefer guard clauses and early returns over unnecessary nesting, but preserve cleanup, transaction outcomes, locks, streams, and resource ownership. Keep required `finally`/disposal paths intact; use structured branching when an early return would bypass required work.
- Keep a cohesive use case readable together. Extract files/functions for meaningful responsibilities, boundaries, or reuse, not an automatic one-function-per-file policy.
- Avoid the opposite extreme of a giant service/module holding unrelated use cases. Make only the separation necessary for the approved change.
- Prefer clear intermediate names and direct control flow over terse expressions. Readability is not a reason to change unrelated behavior.

## Allowed Shapes and Narrow Exceptions

These allowances do not waive explicit mapping, runtime validation, or scope limits:

- `unknown` is appropriate for untrusted input when it is validated and narrowed before use.
- Use library-provided option types for library configuration; do not wrap every options object or temporary value in a domain class.
- Named internal `type`/`interface` declarations are appropriate for internal structures that are not project-owned domain entities or DTOs.
- Typed dictionaries are appropriate when dynamic keys are a genuine domain requirement. Declare the key/value contract and validate external entries; do not disguise arbitrary model properties as a dictionary.
- Spread is allowed only when genuinely unavoidable for a required API compatibility contract and no explicit alternative preserves that contract. Explain the exact API constraint and why explicit alternatives fail, and record the exception in the implementation handoff. Convenience, terseness, and existing style are not exceptions. If necessity is unclear, stop and ask.

There is no blanket framework exception to the class or other MUST rules. If a framework requires an incompatible representation or a convention would alter required behavior, stop and request an explicit resolution rather than silently bypassing it.

## Handoff and Report Convention

Inherit the parent's report style and the project's Response Style, preserving exact file paths, commands, API names, and errors.

Use the parent's completion and handoff contract, including changed areas, task/requirement states, exact approved correction IDs when relevant, blockers, and approved deviations. State that testing, verification, and independent review were not performed in this stage; identify what later sessions must establish without claiming correctness evidence.

Do not create a report file automatically. When the user requests a written report, invoke `hero-report` with source stage `hero-coding` and the parent's coding-report contract (`docs/coding-reports/YYYY-MM-DD-<slug>.md`). Identify `hero-node` as the specialization in the content if useful. Do not create a new report category, directory, or workflow stage.
