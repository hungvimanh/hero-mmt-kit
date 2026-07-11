# Design Spec — UI/UX Design Sub-Workflow for hero-vibe-kit

- **Date:** 2026-06-03
- **Slug:** `design-uiux-workflow`
- **Status:** Approved (brainstorm) → pending implementation plan
- **Scope target:** the framework itself (`templates/`, `skills.manifest.json`, `src/integrations.cjs`, CLI verify) — dogfooded change.

---

## 1. Problem

The kit is mature on the engineering side (router, paths, gates, artifacts, security, performance, communication) but **UI/UX design is the thinnest, most under-specified discipline**. Today design appears in only three disconnected places:

- `templates/docs/{en,vi}/TEAM_ROSTER.md` §3 — "PICK ONE design skill" (a 6-skill list + a one-line tokens note).
- `templates/docs/{en,vi}/AGENCY_WORKFLOW.md` Phase 3.5 — one sentence: "Frontend follows one locked design direction".
- Router row #7 — a vague mention of "design system".

### Confirmed gaps (all four prioritized by the user)
1. **No design discovery / direction gate** — "pick one skill" with no process to *decide* the direction before building; risk of building many components then discovering the aesthetic is wrong.
2. **UX is not separated from UI** — flows / IA / screen inventory / states have no home. `INTERACTION_PATTERNS.md` covers only the *AI assistant's* conversational UX, not general product UX.
3. **No job→skill routing** — brand vs visual-direction vs reference-image-generation vs redesign are conflated as one mutually-exclusive "direction".
4. **No design artifacts and no Design DoD** — no Design Brief, no Design System / tokens home, no visual-QA report, no UI completion criteria (responsive / a11y / states).

### Design must fit the product (user-driven refinements)
- Design effort is **two axes, not one**: *discipline/consistency* and *creativity*. Internal/CRUD/B2B software wants **high discipline, low creativity** (strict, consistent layout/spacing, reuse). End-user/consumer software wants **higher creativity** while staying consistent. → model this with **3 design profiles**, not a single "full vs lightweight" rigor knob.
- Design output is **not only CSS/components** — products often need **embedded media** (icons, illustrations, hero imagery, OG/social images, diagrams, optional motion). The workflow needs a **media/asset production** branch.
- **Platform varies** — some products are web-only, some are web + mobile app. The workflow needs a **platform** dimension with one shared design system and platform-specific pattern layers.
- **Tooling** — media can be produced via a configured **AI media-generation provider** (provider-agnostic, API key from the consumer's environment), with **graceful fallback to Claude subagents** (`imagegen-*`, `brandkit`) when nothing is configured.
- **In-product help** — produced software must ship a **user guide / help surface inside the product** on a *secondary* surface (not the primary functional nav), giving detailed usage instructions; content style scales from text → illustrated → onboarding tour by profile. Currently **absent** from the framework (grep of `templates/` finds no help/guide/onboarding/tooltip concept; `INTERACTION_PATTERNS.md` is only AI-assistant conversational UX).

### Secondary findings
- `skills.manifest.json` `design` group sets `pickOne: true` across `design-taste-frontend`, `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `brandkit` — but `brandkit` (identity) and reference/implementation tools are **not** mutually exclusive with a taste direction.
- Complementary design skills already vendored under `.agents/skills/` (`imagegen-frontend-web`, `imagegen-frontend-mobile`, `image-to-code`, `redesign-existing-projects`, `gpt-taste`) are **absent** from the manifest.
- `src/integrations.cjs` hardcodes `manifest.groups.design` (line ~57) → **restructuring the manifest requires a code change here**.
- The project's own `brainstorming` skill ships a browser `visual-companion` (mockup loop) that the workflow never references for locking design.

---

## 2. Constraints (house rules — must hold)

- **SSOT for process:** `AGENCY_WORKFLOW.md` is the *only* canonical **process** document. Design *sequencing / phases / gates / router rows* must live there. A separate doc holds **standards** only (mirroring `SECURITY_STANDARDS.md` / `PERFORMANCE_STANDARDS.md`).
- **Bilingual parity:** every change under `templates/docs/en/*` is mirrored in `templates/docs/vi/*` (same files, structure, internal links). `npm test` checks link integrity both ways.
- **Zero runtime dependencies**; CLI uses Node built-ins only. The CLI never calls a media API at runtime — it only records configuration; the agent performs media generation during a design task.
- **No secret committed** — the media provider's API key is read from the consumer's environment; the kit stores only the provider name + env-var name (see `SECURITY_STANDARDS.md` §5).
- **Placeholders:** `{{...}}` rendered at init; `<TBD>` filled by the end user.
- **Never** instruct hand-edits inside `<!-- hero-vibe-kit:start/end -->` managed regions.
- **Don't redistribute third-party skills** — reference them in `skills.manifest.json` and install via the `skills` CLI; never fabricate a `source`.

---

## 3. Chosen approach — "B: Design as a first-class but lean discipline"

A new **`DESIGN_STANDARDS.md`** holds standards + skill routing + design profiles + media + platform guidance, modeled on the existing standards docs. The **process** is woven into `AGENCY_WORKFLOW.md` (a new router row + additions to Phases 1–4, reusing the existing Gate 2). The track **adapts via design profiles**, and an optional **media-generation integration** is wired into init.

Rejected: **A (light, no new doc)** — leaves design hidden, overloads TEAM_ROSTER. **C (parallel design pipeline / separate path)** — too heavy for a lean-agency kit.

### Decided forks
- **Manifest:** restructure into **3 groups** — `brand` (`brandkit`), `design-direction` (`pickOne: true` taste skills), `design-tools` (imagegen-web/mobile, image-to-code, redesign-existing-projects).
- **Design System home:** durable doc **`docs/design/DESIGN_SYSTEM.md`** (created on first UI work).
- **Design Brief template:** **yes** — `templates/docs/{en,vi}/templates/DESIGN_BRIEF.md`.
- **Design profiles:** **3** — `system-strict`, `branded-product`, `expressive`.
- **Media-gen tool:** **build now** — optional, **provider-agnostic** integration + docs, with Claude-subagent fallback.
- **In-product help:** **required** for every UI product (depth by profile); standards live **inside DESIGN_STANDARDS**; standardize **4 patterns** (dedicated help/guide page, first-run onboarding, contextual help, FAQ/troubleshooting); content authored as **Markdown/MDX in `docs/help/`** and rendered in-app.

---

## 4. Detailed change-set

> All doc changes are made in **both** `en/` and `vi/`. VI is a faithful translation with identical structure and links.

### 4.1 NEW — `templates/docs/{en,vi}/DESIGN_STANDARDS.md`
Standards + how-to, **no process sequencing** (links to AGENCY_WORKFLOW for "when"). Sections:

- **§0 Scope & how to use** — this doc = standards + routing + profiles; sequencing lives in AGENCY_WORKFLOW; per-PRD specifics locked as `<TBD>`.
- **§1 UX ↔ UI (two layers)**
  - *UX (problem space):* personas, primary flows, IA, screen inventory, per-screen states (empty/loading/error/success/partial).
  - *UI (solution surface):* brand, one locked visual direction, design tokens, component system.
- **§2 Design profiles (fit the product)** — choose ONE per project at Phase 1/2; record it in `DESIGN_SYSTEM.md` and TEAM_ROSTER. Each profile sets the *creativity × discipline* balance and which steps are required vs skippable:

  | Profile | Typical product | Creativity | Discipline | Brand & media | Required steps | Skippable |
  |---|---|---|---|---|---|---|
  | **system-strict** | internal tools, CRUD, B2B admin | low | very high | minimal; standard icon set, no bespoke media | one locked token set (lean direction e.g. `minimalist-ui`), strict layout/spacing/component reuse, a11y, consistency QA | brand exploration, imagegen exploration, custom media |
  | **branded-product** | end-user SaaS / productivity apps | medium | high | brand tokens + selective bespoke media (empty-states, key illustrations) | direction gate, design system, imagegen for key screens, selective media | heavy marketing media, per-section creative gates |
  | **expressive** | consumer, marketing/landing, brand-forward | high | consistent | full brand (`brandkit`) + rich embedded media + motion | brand, direction exploration, media production, design system, per-section visual review, media-perf QA | — |

  Default when product type is unknown: **branded-product** (sane middle), explicitly confirmed at the gate.
- **§3 Design skill routing table** (job → skill → when):

  | Need | Skill | When |
  |---|---|---|
  | Brand / identity (logo, brand board) | `brandkit` | New product/brand or rebrand. Once. (branded-product / expressive) |
  | **Lock a visual direction — PICK ONE** | one of `design-taste-frontend` · `minimalist-ui` · `industrial-brutalist-ui` · `high-end-visual-design` · `gpt-taste` | Phase-2 gate. Exactly one, then locked. |
  | Generate reference images (web) | `imagegen-frontend-web` | Explore/lock the look per section before coding. |
  | Generate reference images (mobile) | `imagegen-frontend-mobile` | Mobile screen exploration. |
  | Turn an approved design image into code | `image-to-code` | Implementing from an approved visual reference. |
  | Redesign / audit an existing UI | `redesign-existing-projects` | Router row #9 on existing surfaces. |
  | Interactive wireframes / A-B visual choices | `brainstorming` + `visual-companion` | UX wireframing and layout selection. |

  Plus a one-line "pick by vibe" guide for the taste skills (minimalist-ui = clean editorial; industrial-brutalist-ui = raw mechanical/terminal; high-end-visual-design = expensive agency feel; gpt-taste = editorial + GSAP motion; design-taste-frontend = anti-slop general default).
- **§4 Design tokens & system** — tokens are the **single source of truth** (color/type scale/spacing/radius/shadow/motion); **no hardcoded values** in components; naming conventions; the **"pick exactly one direction"** rule (moved here from TEAM_ROSTER).
- **§5 Platform** — declare scope per project: web-only / mobile-only / web+mobile. **One shared token source is canonical**; platform layers add platform-specific patterns — web: responsive breakpoints; mobile: native navigation, platform conventions (HIG / Material), touch targets, safe areas. Routing: `imagegen-frontend-web` vs `imagegen-frontend-mobile`.
- **§6 Media / asset production** — beyond CSS:
  - *Asset types:* icons, illustrations, photography/hero imagery, OG/social share images, diagrams, **help/onboarding visuals (annotated screenshots, GIF/short video — see §8)**, optional short motion (lottie/video).
  - *Render paths:* (a) a **configured AI media provider** (provider-agnostic; key from env) for higher-fidelity raster/illustration; (b) **Claude-subagent fallback** (`imagegen-frontend-web/mobile`, `brandkit`) when no provider is configured — produces references, mockups, prompts, and within-capability assets.
  - *Storage:* source/reference & exploration assets → `docs/design/assets/` (durable, reviewable; keep small — large raw files go under a gitignored path); production-ready, optimized assets → the app's own asset directory (consumer `<TBD>`).
  - *Asset DoD:* optimized/compressed, right format (SVG/WebP/AVIF where apt), rights-clear/licensed, alt text, responsive `srcset` where apt.
- **§7 Visual QA checklist** — responsive across declared breakpoints; a11y WCAG **AA** baseline (contrast, visible focus, keyboard nav, alt text, semantic landmarks); all states covered; cross-browser; dark mode (if applicable); `prefers-reduced-motion` respected; media weight within the performance budget.
- **§8 In-product help & onboarding** — every product with a UI ships an in-product help surface on a **secondary** surface (under a `?` icon / settings / footer — never the primary functional nav).
  - *Pattern library (standardize 4):* (1) **dedicated Help/Guide page** — its own section in secondary nav, table of contents by task; (2) **first-run onboarding** — tour/coachmarks, skippable and replayable; (3) **contextual help** — tooltips, inline hints, empty-state guidance where the user needs it; (4) **FAQ / troubleshooting** — common questions + error resolution, searchable.
  - *Depth by profile:* `system-strict` = structured text + screenshots; `branded-product` = + annotated images + empty-state hints; `expressive` = + onboarding tour + GIF/short video.
  - *Content source:* authored as **Markdown/MDX in `docs/help/`** (versioned, reviewable), rendered in-app; mirrors the project language(s); follows the same a11y baseline.
  - *Sync rule:* a feature with user-facing impact is **not done** until its help entry exists and is accurate.
- **§9 Artifacts** — link to `ARTIFACTS_AND_STORAGE.md`.

### 4.2 `AGENCY_WORKFLOW.md` (process — edited in place)
- **Router §1 — add row #9 "UI/UX Design / Redesign".** Trigger: "redesign this page", "design the screens for X", "improve the UI". Path: **Standard** (gated); **Fast** for a tiny isolated tweak. Gate: **YES** (visual-direction sign-off). Branch: `design/`. Steps: pick profile → UX (if new screens) → pick one direction → lock tokens/design system → produce media (if profile needs it) → implement (incl. in-product help/guide) → Visual QA. DoD: Design DoD. Also amend **row #7** to reference the design track when the feature has UI.
- **Phase 1 (Discovery)** — when the feature has UI: PRD includes *design profile + screen inventory + primary flows + per-screen states + which help patterns apply* (help/onboarding need); reference `DESIGN_STANDARDS.md` §1–§2, §8 and the `DESIGN_BRIEF.md` template.
- **Phase 2 (Architecture & Planning)** — add: *pick the design profile*, *lock the visual direction* (one taste skill; optionally explore via `visual-companion` / `imagegen-*`), *define tokens/design system as part of the contract*, and *plan media production* (provider vs subagent). **Gate 2** now also presents the profile + chosen direction + key-screen mockups for sign-off before implementation. (No third gate.)
- **Phase 3 (Implementation)** — refine §3.5: FE builds against the locked design system; use `image-to-code` from approved references; produce embedded media per §6; do **not** introduce a new direction mid-build.
- **Phase 4 (QA)** — add **Visual QA** running `DESIGN_STANDARDS.md` §7 (incl. media weight) **and verifying the in-product help entry exists & is accurate (§8 sync rule)**; record in `reports/.../design-qa.md`.
- **§4 Related documents** — add a `DESIGN_STANDARDS.md` row.

### 4.3 `TEAM_ROSTER.md`
- §3 becomes a **pointer** to `DESIGN_STANDARDS.md`. Keep the project-specific placeholders: "Profile for {{PROJECT_NAME}}: `<TBD>`" and "Chosen direction: `<TBD>`". Add a one-line "Design/UX lens" note to the personas.

### 4.4 `ARTIFACTS_AND_STORAGE.md`
- Add rows: **UX spec** (Design section in the PRD under `specs/`), **Design System** (`docs/design/DESIGN_SYSTEM.md` — durable: profile, locked direction, tokens reference, component inventory, platform notes), **Design assets** (`docs/design/assets/`), **In-product help content** (`docs/help/` — durable Markdown/MDX source rendered in-app), **Visual QA** (`reports/.../design-qa.md`).
- Update the directory-layout block (add `docs/design/` + `docs/design/assets/` + `docs/help/` + `templates/DESIGN_BRIEF.md`) and the "artifact rules by path" table (Design / row #9 entry).

### 4.5 `DEFINITION_OF_DONE.md`
- Add a cross-cutting **"Design / UI work"** checklist: profile declared & followed; responsive at declared breakpoints; a11y AA baseline; tokens used (no hardcoded design values); all states implemented; platform parity (shared tokens for web+mobile); **media assets meet the asset-DoD** when media is used; **in-product help/guide entry exists, accurate, on a secondary surface (onboarding/contextual help per profile)**; Visual QA recorded. Reference it from Standard/Full when the change includes UI.

### 4.6 `BRANCHING.md`
- Add the `design/` prefix row (router #9); example `design/dashboard-refresh`.

### 4.7 NEW — `templates/docs/{en,vi}/templates/DESIGN_BRIEF.md`
- Fill-in template (sibling of `PRD_AI_FEATURE.md`) forcing the UX/UI dimensions: target users & jobs, **design profile**, platform scope, key flows, screen inventory + states, brand/voice constraints, chosen visual direction, tokens decisions, responsive breakpoints, a11y target, **media asset list + render path (provider/subagent)**, **in-product help & onboarding (patterns to use, what to document, content source)**, references/inspiration, out-of-scope. Uses `<TBD>`.

### 4.8 `skills.manifest.json`
- Replace the single `design` group with three:
  - `brand` (optional): `brandkit`.
  - `design-direction` (optional, `pickOne: true`): `design-taste-frontend`, `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `gpt-taste`.
  - `design-tools` (optional, pickOne **false**): `imagegen-frontend-web`, `imagegen-frontend-mobile`, `image-to-code`, `redesign-existing-projects`.
- Keep a real `source` for each; where the upstream source is unknown, use `"source": "<TBD>"` (never fabricate).

### 4.9 `src/integrations.cjs` (CODE — required)
- Update the design-skill install step (currently reads `manifest.groups.design`) to handle the three new groups: offer `brand`, `design-direction` (pick one), and `design-tools` (install as needed). Record under `cfg.integrations` (e.g. `brand`, `designDirection`, `designTools`).
- Add a new optional prompt: **"Configure an AI media-generation provider? (stores provider + env-var name only; never the key)"** →
  - if yes: capture `provider` (free text), `apiKeyEnv` (env-var name the consumer will set), optional `model`; store `cfg.integrations.mediaGen = { provider, apiKeyEnv, model }`.
  - if no: `cfg.integrations.mediaGen = 'skipped'` and note the Claude-subagent fallback.
- Never read or store the key value itself. Backward-compatible with existing configs.

### 4.10 CLI & tests (verify)
- Confirm `src/init.cjs` copies the whole `templates/docs/<lang>/` tree (new `DESIGN_STANDARDS.md` + `templates/DESIGN_BRIEF.md` ship automatically); if it enumerates files, add them.
- `src/links.cjs` link integrity must pass in both languages.
- Update any test that asserts a fixed file list or the old manifest `design` group shape; add a smoke check that the 3 new groups resolve and that init+doctor stay clean.
- Acceptance: `npm test` green; `node bin/hero-vibe-kit.js init --dir <tmp> --yes && node bin/hero-vibe-kit.js doctor --dir <tmp>` clean.

### 4.11 CHANGELOG
- Unreleased / Added entry: design sub-workflow (DESIGN_STANDARDS with profiles/platform/media/in-product-help, router row #9, Phase 1–4 additions, DESIGN_BRIEF template, manifest 3-group restructure, `design/` branch, optional provider-agnostic media-gen integration with subagent fallback, `docs/help/` in-product help content).

---

## 5. Out of scope (this change)
- Authoring the *content* of any consumer's design system, media, or in-product help (per consumer); the kit standardizes the patterns/artifacts/DoD, not the product copy.
- Building an in-app rendering engine for `docs/help/` (each consumer renders its own help; the kit only defines the source-of-truth location and standards).
- The CLI calling a media API at runtime (kit only records config; the agent generates media).
- Locking to any specific media/image vendor.
- New persona role beyond the "Design/UX lens" note.
- Translating non-template repo meta-docs.

## 6. Risks & mitigations
- **Bilingual drift** → edit en+vi together; rely on `npm test` link integrity; review both.
- **SSOT violation** → DESIGN_STANDARDS holds *standards*; all sequencing/gates stay in AGENCY_WORKFLOW.
- **Manifest/integration breakage** → updating `integrations.cjs` is mandatory with the manifest restructure; cover with init+doctor smoke.
- **Secret leakage** → store only provider + env-var name, never the key; assert in review.
- **Scope creep** → profiles keep system-strict projects light; reuse Gate 2 (no third gate).

## 7. Acceptance criteria
1. `DESIGN_STANDARDS.md` exists in en+vi with §1–§9 (UX/UI, profiles, routing, tokens, platform, media, visual QA, in-product help, artifacts); linked from AGENCY_WORKFLOW §4, TEAM_ROSTER §3, ARTIFACTS, DoD.
2. AGENCY_WORKFLOW has router row #9 and Phase 1/2/3/4 design additions, design folded into Gate 2 — process only, no duplicated standards.
3. `DESIGN_BRIEF.md` template exists in en+vi (includes profile, platform, media list).
4. `ARTIFACTS_AND_STORAGE`, `DEFINITION_OF_DONE`, `BRANCHING` updated in en+vi (artifacts incl. `docs/design/` + assets, Design DoD incl. media, `design/` prefix).
5. `skills.manifest.json` has `brand` / `design-direction` (pickOne) / `design-tools`; no fabricated sources.
6. `src/integrations.cjs` handles the 3 groups and the optional provider-agnostic media-gen prompt (provider + env-var name only); fallback documented.
7. `npm test` green; init+doctor smoke clean; CHANGELOG updated.
8. Bilingual parity verified; 3 design profiles consistently referenced across DESIGN_STANDARDS, AGENCY_WORKFLOW, DESIGN_BRIEF, DoD.
9. In-product help is a deliverable: DESIGN_STANDARDS §8 (4 patterns + depth-by-profile + `docs/help/` source + sync rule), captured in Phase 1, verified in Phase 4, enforced in the Design DoD, and present in DESIGN_BRIEF.
