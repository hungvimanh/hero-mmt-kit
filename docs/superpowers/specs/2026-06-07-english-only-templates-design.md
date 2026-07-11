# Design Spec — English-Only Framework Templates

- **Date:** 2026-06-07
- **Slug:** `english-only-templates`
- **Status:** Approved design direction → pending implementation plan
- **Scope target:** the framework itself (`templates/`, `src/`, tests, README / contributor docs)
- **Decision:** breaking change — remove Vietnamese template support immediately.

---

## 1. Problem

`hero-vibe-kit` currently maintains two parallel documentation template trees:

- `templates/docs/en/*`
- `templates/docs/vi/*`

The framework renders exactly one active docs set into a consumer project based on `--lang en|vi` / `cfg.lang`. This avoids installing duplicate docs in the consumer project, but the framework itself still carries duplicated source content and a bilingual parity rule.

The bilingual source model has become counterproductive:

1. **Higher token cost:** Vietnamese prose is generally longer and less token-efficient than English for framework rules and process instructions.
2. **Higher AI ambiguity:** agents can see or reason about two equivalent-but-not-identical instruction sets and may choose the wrong source or mix wording.
3. **Maintenance drag:** every process/template change must be mirrored in Vietnamese, which slows iteration and creates translation-drift risk.
4. **Mismatch with skills:** vendored skills already ship English-only, so bilingual docs are the outlier.

The desired model is:

- Framework rules, skills, templates, and source-of-truth process docs are **English-only**.
- The assistant still **responds to the user in the language the user uses in chat**, unless the user requests otherwise.

---

## 2. Goals

- Keep a single English source of truth for template docs.
- Remove framework-level bilingual parity requirements.
- Remove the `--lang en|vi` docs-selection workflow from new installs.
- Make assistant conversation language independent from framework template language.
- Reduce token footprint and maintenance overhead.
- Keep zero runtime dependencies.

## 3. Non-goals

- Do not add runtime translation.
- Do not generate Vietnamese docs from English docs.
- Do not preserve `vi` docs as a compatibility mode.
- Do not localize vendored skills.
- Do not change the core agency workflow beyond language/template handling instructions.

---

## 4. Chosen approach — immediate English-only cutover

Use the user's selected option **A: cut Vietnamese templates immediately**.

### Decisions

1. `templates/docs/vi/*` is removed.
2. `templates/docs/en/*` becomes the only docs template source.
3. The framework no longer asks for docs language during `init`.
4. The framework no longer advertises `--lang en|vi` as a supported flag.
5. Consumer `.hero-vibe-kit/config.json` no longer needs a `lang` field for new installs.
6. `update` renders from the single English docs template tree.
7. Existing consumer projects initialized with `lang: "vi"` are not compatibility-preserved by this change. This is an intentional breaking change.

### Source path shape

Prefer simplifying the tree from:

```text
templates/docs/en/...
templates/docs/vi/...
```

to:

```text
templates/docs/...
```

This makes the repository structure match the product decision: there is no longer a language dimension. Keeping `templates/docs/en/` would work mechanically, but it would preserve a misleading hint that other language trees might exist.

---

## 5. Behavioral design

### 5.1 `init`

Current behavior:

- Reads `flags.lang`, preset `lang`, or interactive `Docs language: en|vi`.
- Validates `cfg.lang` is `en` or `vi`.
- Renders from `templates/docs/${cfg.lang}`.
- Logs docs count with `[${cfg.lang}]`.
- Writes `lang` into `.hero-vibe-kit/config.json`.

New behavior:

- Does not ask for docs language.
- Does not require or write `cfg.lang` for new installs.
- Renders from `templates/docs`.
- Logs docs count without a language suffix.
- If old presets contain `lang`, the value is ignored or removed during preset cleanup.

Recommended CLI stance for `--lang`:

- Remove `--lang` from README / command help.
- Treat user-provided `--lang` as an unsupported removed flag if the parser already rejects unknown flags.
- If the parser currently accepts arbitrary flags, explicitly warn that docs are English-only and ignore `--lang`.

### 5.2 `update`

Current behavior:

- Reads `cfg.lang`.
- Renders from `templates/docs/${cfg.lang}`.

New behavior:

- Ignores `cfg.lang` if present.
- Renders from `templates/docs`.
- Writes the new framework version to config as today.
- May remove `cfg.lang` from config during update to normalize old projects.

Although this design accepts a breaking change, normalizing old config is still useful because it prevents stale metadata from implying Vietnamese docs are supported.

### 5.3 `discover`

Current behavior includes English and Vietnamese generated brownfield discovery content. New behavior should be English-only:

- Remove Vietnamese discovery content generation.
- Remove `--lang` / config language selection from discovery.
- Always generate English managed content in `docs/BROWNFIELD_DISCOVERY.md`.
- Keep the assistant free to explain or summarize that English report in Vietnamese during chat.

---

## 6. Assistant communication rule

Add a concise rule to managed templates and workflow docs:

> Framework instructions, skills, rules, and templates are English-only. Respond to the user in the same language they use in chat unless they request another language. Do not translate framework docs at runtime; explain them conversationally when needed.

This separates two concerns:

- **Instruction source language:** English for consistency, token efficiency, and lower ambiguity.
- **Conversation language:** adaptive to the user's chat language.

This rule should appear where agents are likely to read first, such as the managed `CLAUDE.md` / `AGENTS.md` template block and `docs/COMMUNICATION_PROTOCOL.md` or `docs/AGENCY_WORKFLOW.md`.

---

## 7. Documentation updates

Update repository-facing docs:

- `CLAUDE.md`: remove bilingual parity house rule and replace `templates/docs/{en,vi}` references with `templates/docs`.
- `AGENTS.md`: same as `CLAUDE.md`.
- `CONTRIBUTING.md`: remove bilingual parity rule; state template docs are English-only.
- `README.md`: remove language-selection description and `--lang en|vi` flag documentation.
- `CHANGELOG.md`: note the breaking change when implementing.

Update template docs:

- Remove references to bilingual parity.
- Replace path examples using `templates/docs/{en,vi}` with `templates/docs`.
- Add the assistant communication rule described above.

Update design / planning docs only where they are current project instructions or would otherwise mislead future contributors. Historical specs can remain as historical records unless tests or active instructions depend on them.

---

## 8. Test strategy

Tests should match the new single-language model.

### Link tests

Replace EN/VI loops with a single docs-tree check:

- Check links under `templates/docs`.
- Assert that expected workflow docs exist in `templates/docs`.
- Remove the test that compares `templates/docs/vi` and `templates/docs/en` relative file sets.
- Update phase-handoff wiring tests to read from the single docs tree.

### Smoke tests

Update init / brownfield smoke expectations:

- No docs language prompt.
- No `[en]` / `[vi]` language suffix in docs log output.
- No `lang` field required in generated config for new installs.
- `--lang vi` is no longer tested as a valid workflow.

### Regression checks

Run the existing test suite after implementation:

```text
npm test
```

If CLI help tests exist or are added, they should assert that `--lang` is absent or marked unsupported.

---

## 9. Impact and risk

### Expected benefits

- Lower token footprint for framework instructions.
- Lower risk of AI selecting or merging the wrong language source.
- Faster template iteration because changes are made once.
- Better alignment with English-only vendored skills.

### Known risks

- This is a breaking change for users who want Vietnamese source docs.
- Existing consumer projects with `cfg.lang = "vi"` will no longer receive Vietnamese updates.
- Users may assume English-only docs mean English-only chat unless the communication rule is explicit.

### Mitigations

- State the breaking change clearly in README / changelog.
- Add the communication-language rule prominently.
- Normalize or ignore stale `cfg.lang` during update so old config does not mislead agents.
- Keep docs concise and explainable in chat for Vietnamese users.

---

## 10. Acceptance criteria

Implementation is complete when:

1. `templates/docs` contains exactly one English template tree.
2. `templates/docs/vi` no longer exists.
3. `init` no longer asks for docs language.
4. New generated config does not require `lang`.
5. `update` renders docs from the single English template tree.
6. `discover` generates English-only brownfield discovery content.
7. README / contributor / agent instructions no longer mention bilingual parity as an active rule.
8. Managed templates include the rule to respond in the user's chat language.
9. Tests no longer enforce EN/VI parity and pass under `npm test`.
10. The changelog records the breaking change.

---

## 11. Implementation notes for the next plan

The implementation plan should handle changes in this order:

1. Move English docs from `templates/docs/en/*` to `templates/docs/*` and remove `templates/docs/vi/*`.
2. Update CLI code paths that reference `cfg.lang` or `templates/docs/<lang>`.
3. Remove Vietnamese discovery generation and language selection.
4. Update README / contributor / managed template instructions.
5. Update tests from bilingual checks to single-tree checks.
6. Run impact analysis before editing code symbols, as required by project GitNexus rules.
7. Run `npm test` and `gitnexus_detect_changes()` before any commit.

Do not implement during brainstorming. This spec is the handoff into implementation planning.
