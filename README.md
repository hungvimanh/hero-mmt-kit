# hero-vibe-kit

> An opinionated, AI-assisted software-development workflow for **Claude Code** — a task-type router, real gates, enforcement hooks, a human↔AI communication protocol, and security/performance standards. Works for **new** and **existing (brownfield)** projects.

*(English below · [Tiếng Việt ở dưới](#tiếng-việt))*

---

## What it is

`hero-vibe-kit` drops a complete, lightweight development process into your repo so any AI agent (Claude Code first) works the way a disciplined team would:

- **Task-type router** — every request is classified (Q&A · chore · bugfix · hotfix · change · refactor · feature · spike) and routed to the right *path* (Read-only / Fast / Standard / Full). No heavy ceremony for small tasks.
- **Real gates** — "wait for approval" is enforced via Claude Code **Plan Mode**, not prose.
- **Enforcement hooks** — `git-guard` blocks force-push, `--no-verify`, `reset --hard`, and direct pushes to `main`; `stop-reminder` nudges you to keep state updated.
- **Human↔AI communication protocol** — no silent assumptions, blocking vs non-blocking questions, decision/assumption logs — tuned for building AI products.
- **Standards** — a measurable Definition of Done, branching model, and **Security** (incl. OWASP LLM Top 10) + **Performance** (incl. prompt caching) baselines.
- **AI-feature PRD template** + **interaction patterns** for how your product talks to its end-users.

It is **documentation + hooks + a CLI** — it does not bundle third-party tools; it integrates with them and degrades gracefully when they're absent.

## Quick start

```bash
# In your project root (new or existing):
npx hero-vibe-kit init

# For old codebases, create the first AI discovery map:
npx hero-vibe-kit discover

# Then restart Claude Code (or run /hooks) to activate the hooks, and:
npx hero-vibe-kit doctor
```

Non-interactive / CI:

```bash
npx hero-vibe-kit init --yes --preset small-team --lang en --skip-integrations
```

## What `init` installs

```
your-project/
  CLAUDE.md          # hero-vibe-kit managed block (your other content preserved)
  AGENTS.md          # cross-agent entry pointer
  docs/              # AGENCY_WORKFLOW (SSOT) + ARTIFACTS_AND_STORAGE, DEFINITION_OF_DONE,
                     # BRANCHING, TEAM_ROSTER, ACTIVE_STATE, COMMUNICATION_PROTOCOL,
                     # INTERACTION_PATTERNS, SECURITY_STANDARDS, PERFORMANCE_STANDARDS,
                     # templates/PRD_AI_FEATURE; later specs/, plans/, reports/ as needed
  .claude/
    settings.json    # hooks merged into your existing settings (not clobbered)
    hooks/           # git-guard.cjs, stop-reminder.cjs
  .hero-vibe-kit/
    config.json      # your choices (team size, branching, language, integrations)
```

- **New project**: scaffolds everything.
- **Language selection**: `--lang en|vi` renders exactly one active docs set into `docs/`; agents read `docs/AGENCY_WORKFLOW.md`, not duplicate `docs/en` + `docs/vi` trees.
- **Brownfield**: never overwrites your `CLAUDE.md`/`AGENTS.md`/`settings.json` — it inserts a marked managed block and deep-merges hooks. Your `docs/ACTIVE_STATE.md` is never overwritten. Re-running is idempotent; touched files are backed up to `*.bak`.

## The task router (heart of it)

| Task | Path | Gate | Branch |
|------|------|------|--------|
| Q&A / explain / find code | Read-only | — | — |
| chore / docs / config | Fast | — | `chore/` `docs/` |
| small bugfix | Fast | — (repro test) | `fix/` |
| hotfix | Fast | — | `hotfix/` |
| change existing logic | Standard | ✅ | `change/` |
| refactor | Standard | ✅ | `refactor/` |
| new feature | Full (5-phase) | ✅✅ | `feat/` |
| spike / research | Timeboxed | — | `spike/` |

Full details in `docs/AGENCY_WORKFLOW.md` (the single source of truth).

## Integrations (optional — reference & auto-install)

hero-vibe-kit **does not redistribute** third-party tools. `init` offers to set them up from their original sources and degrades gracefully if they're missing.

| Tool | What it is | What init does | Tier |
|------|-----------|----------------|------|
| **superpowers** | process skills (brainstorming, TDD, debugging…) from `obra/superpowers` | offers `npx skills add obra/superpowers` | recommended |
| **taste-skill** | UI/design skills from `Leonxlnx/taste-skill` | offers to install; pick ONE direction | optional |
| **GitNexus** | code-intelligence CLI/MCP | offers `npx gitnexus analyze` | optional |
| **Serena** | semantic code-intelligence MCP | detects existing `.serena/` setup and can seed lightweight pointer notes | optional |

**Required:** Node ≥ 18 and Claude Code. Everything else is optional.

## Commands

| Command | Purpose |
|---------|---------|
| `init` | Install into the current project |
| `update` | Re-render managed regions, preserving your edits & working files |
| `discover` | Scan a brownfield codebase and create `docs/BROWNFIELD_DISCOVERY.md` |
| `brownfield` | Alias for `discover` |
| `doctor` | Validate hooks, settings.json, doc links, tool presence |
| `version` | Print version |

Flags: `--dir <path>` · `--preset solo|small-team|enterprise` · `--lang en|vi` · `--name <name>` · `--yes` · `--skip-integrations`.

## Update & customize

- Edit anything **outside** the `<!-- hero-vibe-kit:start/end -->` markers freely — `update` won't touch it.
- Fill the `<TBD>` placeholders in DEFINITION_OF_DONE / SECURITY / PERFORMANCE once you pick a stack.
- `npx hero-vibe-kit update` refreshes the managed docs/hooks to the latest version, backing up changes.

## Uninstall

Remove `docs/` framework files, the `.claude/hooks/*` + the hooks block in `settings.json`, the
`<!-- hero-vibe-kit:* -->` block in `CLAUDE.md`/`AGENTS.md`, and `.hero-vibe-kit/`.

## License & attribution

MIT (see [LICENSE](./LICENSE)). hero-vibe-kit references but does not redistribute
[obra/superpowers](https://github.com/obra/superpowers) and [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill);
they are installed from source via the `skills` CLI under their own licenses.

---

# Tiếng Việt

> Một quy trình phát triển phần mềm có AI hỗ trợ, dùng cho **Claude Code** — bảng phân loại task, gate thật, hook cưỡng chế, giao thức giao tiếp Human↔AI, và chuẩn bảo mật/hiệu năng. Chạy tốt cho **project mới** lẫn **code cũ (brownfield)**.

## Là gì

`hero-vibe-kit` cài một quy trình phát triển hoàn chỉnh, tinh gọn vào repo của bạn để mọi AI agent (Claude Code trước) làm việc kỷ luật như một team thực thụ:

- **Bảng phân loại task** → chọn đúng *path* (Read-only / Fast / Standard / Full). Việc nhỏ không phải chạy quy trình nặng.
- **Gate thật** qua **Plan Mode** của Claude Code, không phải lời hứa văn xuôi.
- **Hook cưỡng chế** — `git-guard` chặn force-push, `--no-verify`, `reset --hard`, push thẳng `main`; `stop-reminder` nhắc cập nhật trạng thái.
- **Giao thức giao tiếp Human↔AI** — no silent assumptions, câu hỏi blocking/non-blocking, decision/assumption log — thiết kế cho việc xây sản phẩm AI.
- **Chuẩn** — Definition of Done đo được, branching model, và baseline **Security** (gồm OWASP LLM Top 10) + **Performance** (gồm prompt caching).
- **Template PRD cho feature AI** + **interaction patterns** cho cách sản phẩm giao tiếp với end-user.

Đây là **tài liệu + hook + CLI** — không đóng gói tool bên thứ ba; chỉ tích hợp và degrade mượt khi thiếu.

## Bắt đầu nhanh

```bash
# Ở thư mục gốc project (mới hoặc đã có code):
npx hero-vibe-kit init

# Với codebase cũ, tạo bản đồ khám phá ban đầu cho AI:
npx hero-vibe-kit discover

# Khởi động lại Claude Code (hoặc /hooks) để bật hook, rồi:
npx hero-vibe-kit doctor
```

Không tương tác / CI:

```bash
npx hero-vibe-kit init --yes --preset small-team --lang vi --skip-integrations
```

## init cài gì

Như sơ đồ ở phần English: `docs/` (AGENCY_WORKFLOW là single source of truth, ARTIFACTS_AND_STORAGE quy định output/storage + các chuẩn), `CLAUDE.md`/`AGENTS.md` (chèn **block có marker**, giữ nguyên nội dung của bạn), `.claude/` (hook + settings deep-merge), `.hero-vibe-kit/config.json`.

- **Project mới**: scaffold đầy đủ.
- **Chọn ngôn ngữ**: `--lang en|vi` chỉ render một bộ docs active vào `docs/`; agent đọc `docs/AGENCY_WORKFLOW.md`, không load trùng cây `docs/en` + `docs/vi`.
- **Brownfield**: KHÔNG đè `CLAUDE.md`/`AGENTS.md`/`settings.json` — chỉ chèn block + merge hook. `docs/ACTIVE_STATE.md` không bị ghi đè. Chạy lại idempotent; file bị đụng được sao lưu `*.bak`.

## Tích hợp (tùy chọn — reference & auto-install)

hero-vibe-kit **không redistribute** tool bên thứ ba. `init` mời cài từ nguồn gốc và degrade nếu thiếu: **superpowers** (`npx skills add obra/superpowers`, khuyến nghị), **taste-skill** (tùy chọn, chọn 1 hướng), **GitNexus** (`npx gitnexus analyze`, tùy chọn), **Serena** (semantic code-intelligence MCP; pointer notes chỉ là phụ, tùy chọn). **Bắt buộc:** Node ≥ 18 + Claude Code.

## Lệnh & cập nhật

`init` · `update` (giữ chỉnh sửa ngoài marker + file làm việc) · `discover` / `brownfield` (quét codebase cũ và tạo `docs/BROWNFIELD_DISCOVERY.md`) · `doctor` · `version`. Sửa thoải mái phần **ngoài** marker `<!-- hero-vibe-kit:start/end -->`. Điền `<TBD>` khi chốt tech stack.

## Giấy phép

MIT (xem [LICENSE](./LICENSE)). Tham chiếu chứ không redistribute `obra/superpowers` và `Leonxlnx/taste-skill` — cài từ nguồn qua `skills` CLI theo license riêng của chúng.
