---
name: hero-golang
description: Use for implementation-only Go service, CLI, worker, or library changes under an approved plan, bounded request, or exact user-approved review corrections
---

# Hero Golang

## Scope and Mandatory Parent

hero-golang specializes `hero-coding` within the same coding stage; it is not a new stage. Choose it instead of generic `hero-coding` for Go services, CLIs, workers, and libraries. The user does not need to invoke both. A repository does not qualify merely because it contains Go tooling, generated code, or vendored Go dependencies; in a mixed-language request, apply these rules only to the Go portion.

**Before any production edit, read the complete actual sibling [`../hero-coding/SKILL.md`](../hero-coding/SKILL.md), resolved from this skill's installed directory.** Do not substitute a remembered contract, repository template, or metadata declaration for that read. If the sibling is missing or unreadable, stop and report the missing prerequisite; do not reconstruct it.

Inherit the entire parent contract by reference, including approvals, inputs, scope, ledgers, dependencies, blockers, implementation-only boundaries, completion criteria, durable state, handoff, and reporting. The rules below add Go-specific implementation conventions; they do not weaken the parent.

<HARD-BOUNDARY>
Implement only an approved plan explicitly started by the user, a sufficiently bounded request, or exact correction IDs confirmed by prior independent `hero-reviewing` and explicitly approved by the user. Do not choose feedback or expand scope. No architecture design, test authoring/running, verification commands, self-review, review delegation, deployment, release, or Git delivery actions. Assurance and delivery belong to separate later sessions.
</HARD-BOUNDARY>

Maintain the parent's linked task/requirement ledger, respect dependencies, and keep the approved plan immutable. Record deviations and blockers; stop for ambiguity, missing prerequisites, target drift, or unsafe scope expansion. Reading the existing architecture to implement correctly is expected; redesigning it is not. Reconcile implementation coverage, not correctness. Finish with the parent handoff to independent testing and review.

## MUST: Bounded Changes and Project Baseline

Apply these conventions to new code and portions genuinely necessary for the approved change. Do not mechanically convert untouched code to these conventions.

- Before using a language feature or standard-library API, identify the owning module and its supported Go version from `go.mod` (`go` and `toolchain` directives), `go.work` when present, build constraints, and any documented support matrix. The locally installed toolchain does not raise the module's supported version.
- Preserve the existing module/package layout, public API, framework, logging, error, configuration, and dependency choices. Do not impose a `cmd`/`internal`/`pkg` layout, functional options, generics, embedding, or a new library.
- Do not add or upgrade dependencies, edit `go.mod`/`go.sum`/`go.work`, change the toolchain or linter configuration, or change generated or vendored artifacts without approval for that exact change. If implementation requires an unapproved change, stop and record a blocker instead of improvising. Do not run `go mod tidy` or generators in this stage; hand any required regeneration to a separately authorized session.
- Do not add unrelated refactors, migrations, renames, or package moves.
- If requirements, framework constraints, or required behavior conflict with a rule here, stop and escalate with the concrete conflict. Do not silently exempt the framework or change semantics.

## MUST: Formatting Only on Edited Files

- `gofmt -w` may run only on the Go files edited for the current task, named explicitly. Never run it on `.`, `./...`, a broad glob, or files you did not edit.
- `goimports` may run under the same limit only when the project already uses it and it is already installed. Do not download or install any tool.
- Do not format generated or vendored files. If formatting would rewrite unrelated user changes in an edited file, do not run it; record a blocker instead.
- Formatting is an editing step, not verification or correctness evidence. This exception does not permit `go build`, `go vet`, `go test`, linters, race detection, benchmarks, `go generate`, or any other verification command.
- Name every formatting command actually run in the handoff.

## MUST: Errors and Failure Paths

- Preserve the existing sentinel errors, error types, and wrapping contract that callers depend on. Wrapping with `%w` exposes the cause as part of the API; use it when callers should match the cause and `%v` when they should not.
- Match wrapped errors with `errors.Is` and `errors.As`, never with `==` against a possibly wrapped error or by comparing error strings.
- Never discard an error with `_` unless it is a documented best-effort cleanup whose failure cannot affect results; state the reason in a comment.
- Handle an error once: return it with useful context or log it at the boundary that owns the decision, not both at every layer.
- Avoid typed-nil errors: a nil pointer stored in an interface is not equal to `nil`. Return a literal `nil` on a successful error path; do not return a typed nil pointer as an `error`.
- Return errors for invalid input and expected operational failures instead of panicking. Do not call `log.Fatal` or `os.Exit` from library or helper code; the application entry point owns process termination and must preserve required cleanup.

## MUST: Context, Goroutines, and Channels

- When adding context-aware operations, accept `context.Context` as the first parameter and propagate it to blocking calls that support cancellation. Do not silently break an existing API to add context. Prefer passing context explicitly over storing request contexts in structs; do not replace an available context with `context.Background()` or a placeholder context.
- Call the `cancel` function of every derived context on all paths, normally with `defer cancel()` right after creation.
- Every goroutine you start needs an owner and a guaranteed exit through completion, cancellation, or channel closure. Do not start fire-and-forget goroutines.
- A send or receive that can block must also select on `ctx.Done()` or have another proven exit. A buffered channel is not a cancellation mechanism.
- Define the channel-closing owner: the sender or a coordinator that knows every sender has finished. Only that owner closes it, exactly once when closure is part of the protocol; merely creating or receiving from a channel does not make closing it safe.
- Deliver results and errors together, or through a defined error path, so a consumer can never wait forever for a result that failed.
- Decide how results are consumed before starting producers. A producer that blocks on an unbuffered results channel needs a concurrent reader; do not wait for producers on the same goroutine that must read their output.
- Bound concurrency when work fans out over unbounded input. With manual WaitGroup accounting, call `WaitGroup.Add` before the `go` statement. Capture loop variables according to the owning module's Go language version; do not assume the installed toolchain changes older loop semantics.
- Prefer concurrency helpers already available in the module; using `errgroup` does not justify adding `golang.org/x/sync` without explicit dependency approval. Do not convert synchronous code into goroutines for style.

## MUST: Shared State, Ownership, and Resources

- Guard shared mutable state with the project's existing synchronization approach. Do not copy values containing `sync.Mutex`, `sync.WaitGroup`, or other `sync` types after first use; pass them by pointer.
- Initialize maps before writing to them. Remember that slices returned by `append` or slicing may share a backing array; return copies of internal slices or maps when callers must not mutate them.
- Never return a slice that aliases a pooled or reused buffer after that buffer is reset or returned to the pool. Copy the data first, or transfer ownership explicitly:

```go
buf := bufferPool.Get().(*bytes.Buffer)
defer func() {
	buf.Reset()
	bufferPool.Put(buf)
}()
buf.Write(data)
out := make([]byte, buf.Len())
copy(out, buf.Bytes())
return out
```

  Do not add `sync.Pool` or similar optimizations unless the approved scope asks for them.
- Release owned resources on every path: close files and HTTP response bodies, release locks, and complete transactions with commit or rollback. Register `defer` only after the acquiring call's error check.
- Check the error from `Close`, `Flush`, `Sync`, or `Commit` when it can lose or corrupt written data.
- Do not `defer` inside a loop when that holds every iteration's resource until the function returns; release per iteration or extract a function. This is not a ban on `defer`.

## MUST: Boundary Data and Zero Values

- Decoding or type conversion is not validation. Validate decoded JSON, database rows, environment values, and request parameters against the approved contract before use.
- Distinguish absent, `null`, zero, and empty values only where the contract distinguishes them, using pointers, `sql.Null*` types, or explicit presence fields. Do not invent rejection rules; zero or empty may be valid.
- Preserve existing JSON/DB tags and wire representations. Map between transport DTOs and domain types field by field when they differ.
- A successful HTTP round trip is not a successful business result. Check the status code and response contract the requirements define.
- Bound reads of untrusted input or responses when the contract or existing code sets limits.

## PREFER: Readable, Cohesive Go

- Prefer guard clauses and early returns over unnecessary nesting, but preserve cleanup, transaction outcomes, locks, and resource ownership.
- Keep a type's receiver kind consistent with its existing methods; if one method needs a pointer receiver, new methods on that type use pointer receivers.
- Define small interfaces in the consuming package and only when the approved change needs that seam. Do not introduce an interface for a single implementation by default.
- Do not add new package-level mutable state or `init()` side effects; pass dependencies explicitly.
- Keep cohesive logic together. Extract functions or packages for meaningful responsibilities, not into generic `util`/`common` buckets.

## Allowed Shapes and Narrow Exceptions

These allowances do not waive validation, ownership, or scope limits:

- Package-level sentinel errors and immutable values such as precompiled regular expressions are fine.
- `panic` or `Must*` helpers are acceptable for programmer invariants and constant inputs at initialization, not for runtime input.
- `_ =` is acceptable only with a comment explaining why the error cannot matter.

There is no blanket framework exception to the MUST rules. If a framework or required API forces an incompatible shape, stop and request an explicit resolution rather than silently bypassing it.

## Handoff and Report Convention

Inherit the parent's report style and the project's Response Style, preserving exact file paths, commands, API names, and errors.

Use the parent's completion and handoff contract, including changed areas, task/requirement states, exact approved correction IDs when relevant, blockers, and approved deviations. List any formatting command actually run. State that testing, verification, and independent review were not performed in this stage; identify what later sessions must establish without claiming correctness evidence.

Do not create a report file automatically. When the user requests a written report, invoke `hero-report` with source stage `hero-coding` and the parent's coding-report contract (`docs/coding-reports/YYYY-MM-DD-<slug>.md`). Identify `hero-golang` as the specialization in the content if useful. Do not create a new report category, directory, or workflow stage.
