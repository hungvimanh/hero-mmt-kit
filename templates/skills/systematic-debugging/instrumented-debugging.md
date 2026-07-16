# Instrumented Debugging (Checkpoints Instead of Breakpoints)

## Overview

Sometimes you have a concrete, known input — a specific API payload, method, and route — but you don't want to attach a debugger or run the app in debug mode. You still need to see what the code actually did with that data at each point along the way.

**Core principle:** Place structured log checkpoints at the same locations you'd otherwise set breakpoints, trigger the code with a **temporary unit test** whose input is built directly from the data provided, then read the collected trace instead of stepping through it live.

This is a hero-mmt-kit-original addition to `systematic-debugging` (see `NOTICE`), used within its Phase 1 (Root Cause Investigation) when the bug is reproducible from known input but not being debugged interactively.

**This does not execute a real HTTP request against a running app.** The trigger is a unit test that calls the entry point function directly (or drives it in-process, e.g. via the project's existing supertest-style helper if one exists) — no server needs to be up, no real network call is made.

## When to Use

- The bug is reproducible from **one known input** (method + route + payload, or equivalent function arguments) — all of it known up front.
- It looks like a **logic or data bug** — wrong value, wrong branch taken, wrong transformation — not a crash, performance issue, or security defect.
- You'd rather not attach a debugger or run the app in debug mode.

**Don't use this for:**
- Bugs you can't reproduce from a known input — go gather more evidence first (main `SKILL.md`, Phase 1).
- Crashes with a clear stack trace — read the trace, don't instrument around it.
- Anything requiring inspecting memory/perf timing — this technique captures values at points in time, not performance profiles.
- Bugs that only manifest through the real network/process boundary (e.g. serialization over an actual socket, real middleware ordering across processes) — those need an actual running app, which is out of scope for this technique.

## Required Input Contract

Before writing the test or inserting any checkpoint, confirm you have all of the following. If anything is missing, ask — don't guess:

1. **Method + route/endpoint** (e.g. `POST /api/orders/:id/apply-discount`) — used to locate the entry point, not to make a real call.
2. **The payload** — body/params/query/headers, as a curl command or as plain data (JSON body, path params, etc.) — this becomes the unit test's input, verbatim.
3. **Expected vs. actual behavior** — what the return value/response/state should be, and what it actually is.

## The Process

### 1. Locate the Entry Point

Find the function the given route resolves to — route handler/controller, or the service/business-logic function it delegates to if that's a closer match to the reported symptom. Grep for the route string, or use GitNexus `route_map` / `api_impact` if the repo is indexed. Don't guess which file handles it — confirm by reading it.

### 2. Map the Likely Call Path

Read the code to sketch the path the input takes: handler → service/business logic → repository/DB → external calls → response construction. This is a static read, not a guess — open each file in the chain before instrumenting it.

### 3. Find the Project's Existing Test Pattern

Look for an existing test file covering this module or a sibling route/handler. Reuse its conventions: test framework (Jest/Vitest/Mocha/pytest/...), how it mocks the DB/external calls, and — if the entry point is an HTTP handler — how it invokes routes in-process (e.g. `supertest(app).post(...)`, a test client, or a direct call with constructed `req`/`res` objects). Don't invent a new test-setup style if the project already has one.

### 4. Choose Checkpoint Locations (Minimal First Pass)

Pick roughly **3–6** points, each one a location you'd otherwise set a breakpoint:
- Function/handler entry — log the raw inputs.
- Before/after any branch that affects the outcome (the `if` that decides which path is taken).
- Before/after the suspect data is transformed or persisted.
- Right before the return value/response is constructed.

Instrumenting everything at once defeats the purpose — it's as noisy as not instrumenting at all. Start narrow. If the first pass doesn't localize the divergence, add a **denser second pass** only around the checkpoint where things started going wrong.

### 5. Insert Tagged Checkpoints

Use a unique, greppable tag per debugging session so the output can be filtered from normal test noise, and log actual values — not just "reached this line":

```javascript
// Node/Express example
console.error(`[DBG:ORD-482] applyDiscount:entry`, { orderId, discountCode, cartTotal });
...
console.error(`[DBG:ORD-482] applyDiscount:afterLookup`, { discountCode, discount });
...
console.error(`[DBG:ORD-482] applyDiscount:branch`, { eligible, reason });
```

```python
# Python example
print(f"[DBG:ORD-482] apply_discount:entry order_id={order_id} code={discount_code} total={cart_total}")
```

Use whatever the language/runtime's cheapest, most direct output mechanism is (`console.error`, `print`, `System.out.println`, `log.Printf`, ...) — this is throwaway instrumentation, not permanent logging, so it doesn't need to go through the project's logger.

### 6. Write the Temporary Test

Create a throwaway test file (clearly named, e.g. `tmp.instrumented-debug.test.ts`) that:
- Builds the input exactly from the payload provided (parse the curl `-d`/`--data` body into the same shape the code expects; map path/query params; construct a minimal `req`/`res` if calling a raw handler, or use the project's in-process route-testing helper found in step 3).
- Calls the entry point directly — no server start, no real network call.
- Asserts nothing yet, or asserts only the expected-vs-actual outcome from the bug report — its job here is to **trigger** the checkpoints, not to be a polished regression test.

### 7. Run the Test and Collect the Trace

Run just that one test file with the project's test runner (e.g. `npx jest tmp.instrumented-debug.test.ts`, `pytest test_tmp_instrumented.py`). Test runners pass through `console.error`/`print` output by default — capture it and filter by the session tag:

```bash
npx jest tmp.instrumented-debug.test.ts 2>&1 | grep 'DBG:ORD-482'
```

### 8. Analyze Checkpoint-by-Checkpoint

Walk the checkpoints in order, comparing the logged value against what you expected at that point. The **first checkpoint where the actual value diverges from the expected one** is where the root cause lives — or where you need to trace further back (switch to `root-cause-tracing.md` in this directory if the divergence itself needs tracing to an even earlier source). Once localized, continue into the main `SKILL.md` process: Phase 2 (Pattern Analysis) → Phase 3 (Hypothesis and Testing) → Phase 4 (Implementation).

### 9. Mandatory Cleanup

Before ending the debugging session:

- Delete the temporary test file created in step 6.
- Remove **every** checkpoint line inserted in step 5.
- Run `git status`/`git diff` and confirm no debug-only test file or log lines remain in the working tree.
- If the temporary test turns out to be worth keeping as a real regression test, or a particular log genuinely belongs permanently, that is a **separate, explicit decision** — call it out to the user rather than silently leaving debug scaffolding behind disguised as real code.

## Example

**Bug report:** `POST /api/orders/482/apply-discount` with body `{ "discountCode": "SAVE10", "cartTotal": 45 }` should return a discount of `10`, but returns `0`.

**Checkpoints inserted** (3, first pass):

```javascript
function applyDiscount(orderId, discountCode, cartTotal) {
  console.error(`[DBG:ORD-482] entry`, { orderId, discountCode, cartTotal });

  const discount = lookupDiscount(discountCode);
  console.error(`[DBG:ORD-482] afterLookup`, { discount });

  const eligible = cartTotal >= discount.minimumSpend;
  console.error(`[DBG:ORD-482] branch`, { eligible, minimumSpend: discount.minimumSpend });

  return eligible ? discount.amount : 0;
}
```

**Temporary test** (`tmp.instrumented-debug.test.ts`), input built directly from the reported payload:

```javascript
const { applyDiscount } = require('../src/orders/discount');

test('tmp: trace apply-discount for order 482', () => {
  applyDiscount(482, 'SAVE10', 45);
});
```

**Trace collected** (`npx jest tmp.instrumented-debug.test.ts 2>&1 | grep DBG:ORD-482`):

```
[DBG:ORD-482] entry { orderId: 482, discountCode: 'SAVE10', cartTotal: 45 }
[DBG:ORD-482] afterLookup { discount: { amount: 10, minimumSpend: 50 } }
[DBG:ORD-482] branch { eligible: false, minimumSpend: 50 }
```

**Analysis:** `discountCode` and `discount` lookup are correct — the divergence is at the branch: `cartTotal` (45) is below `minimumSpend` (50), so `eligible` is correctly `false` per the code, but the user expected `SAVE10` to apply regardless of cart total. Root cause is a **data/spec mismatch**, not a code bug: `SAVE10`'s `minimumSpend` was configured wrong. Fix at the source (the discount config), not by patching the branch.

**Cleanup:** `tmp.instrumented-debug.test.ts` deleted, all three `console.error` lines removed, `git status` confirmed clean before closing the session.

## Key Principle

Checkpoints are a stand-in for breakpoints, and a temporary unit test is the stand-in for manually driving the app — reproducible from known input, minimal, tagged, read once, then both the test and the logs are removed. Finding the divergent checkpoint doesn't end the process; it tells you where Phase 2 (Pattern Analysis) should start looking.
