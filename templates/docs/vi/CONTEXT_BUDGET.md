# Context Budget Protocol

Main Agent là bộ điều khiển workflow, không phải kho chứa transcript. Dùng protocol này để giữ session Claude Code đủ nhẹ để tiếp tục ổn định, đặc biệt trong các việc Standard và Full path kéo dài.

Routing và gate nằm trong [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md). Hành vi theo vai trò nằm trong [TEAM_ROSTER.md](./TEAM_ROSTER.md). State bền vững và artifact resume tuân theo [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).

## 1. Mục đích

Protocol này giảm lỗi context window bằng cách chuyển state bền vững ra artifact, giới hạn output của sub-agent, và bắt buộc quyết định checkpoint/compact/tách session ở các thời điểm rủi ro cao.

Protocol xử lý các lỗi như:

```text
API Error: 400 Your input exceeds the context window of this model.
```

## 2. Ngoài phạm vi

Protocol này không:

- tự động chạy `/compact`,
- thay đổi settings của Claude Code,
- thêm runtime dependency,
- thêm MCP server quản lý memory,
- bắt mọi task Fast nhỏ phải có `resume.md`,
- thay thế workflow router hoặc Definition of Done.

## 3. Dấu hiệu context pressure

Kích hoạt protocol này khi có một trong các dấu hiệu:

- Main Agent đã đọc nhiều file lớn,
- diff dài hoặc trải trên nhiều file,
- test output hoặc log dài,
- sub-agent trả response dài,
- nhiều vòng review/fix lặp lại,
- Main Agent chuẩn bị đọc lại context rộng,
- Claude Code chậm, rối hoặc mất state,
- User báo vấn đề context,
- Claude Code trả lỗi API 400 do context window.

## 4. Quy tắc không dump

Mặc định Main Agent không được paste các nội dung này vào chat:

- toàn bộ nội dung file,
- toàn bộ diff,
- toàn bộ test log,
- toàn bộ transcript sub-agent,
- toàn bộ spec hoặc plan khi chỉ cần một task,
- output command không filter khi chỉ cần pass/fail hoặc đoạn ngắn.

Ưu tiên:

- excerpt có mục tiêu,
- summary,
- trích dẫn file/path,
- report artifact,
- finding ngắn gọn từ sub-agent.

## 5. Protocol output command có biên

Chạy command ồn theo bounded mode:

1. redirect raw output vào log artifact,
2. chỉ in exit code, pass/fail, count, top error và log path,
3. chỉ đọc full log khi debug,
4. delegate log analysis dài cho sub-agent khi việc đó bảo vệ context chính.

Ví dụ command ồn: `git diff`, `npm test`, `dotnet build`, `dotnet test`, MCP exploration, broad search và generated transcript.

Mặc định dùng command summary:

```text
git diff --stat
git diff --name-status
git diff --check
```

Lưu raw command output dưới `docs/reports/YYYY-MM-DD-<slug>/logs/` khi cần artifact bền vững.

## 6. Trigger checkpoint bắt buộc

Checkpoint trước khi đi qua các ranh giới:

- Discovery → Planning,
- Planning → Implementation,
- Implementation → QA/review,
- QA/review → Handover,
- Handover → commit/PR/merge.

Cũng checkpoint bất cứ khi nào context pressure cao.

Với Standard và Full path, tạo hoặc cập nhật `docs/reports/YYYY-MM-DD-<slug>/resume.md` khi công việc kéo dài hoặc context pressure cao. Với Fast path nhỏ, cập nhật `ACTIVE_STATE.md` là đủ trừ khi context pressure cao.

## 7. Resume packet

Resume packet là state ngắn gọn để restart, không phải transcript được copy lại.

Lưu tại:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Dùng format:

```markdown
# Resume Packet — <work item>

## Current state
- Path:
- Phase:
- Status:
- Last completed step:

## Goal
- User-facing goal:
- Non-goals:

## Approved decisions
- Decision:
- Reason:
- Source artifact:

## Files changed
- `path`: what changed

## Artifacts
- Spec:
- Plan:
- Reports:
- Active state:

## Verification evidence
- Command:
- Result:
- Notes:

## Open risks / blockers
- Risk:
- Blocker:
- Needs user decision:

## Next action
- Do next:
- Do not do:
- Required skill/tool:

## Context hygiene
- Do not reread:
- Do read:
- Do not paste:
- Prefer:
```

## 8. Prompt compact

Khi tiếp tục trong cùng session, dùng:

```text
/compact Summarize only durable state for continuing this task. Include: goal, approved decisions, current path/phase, files changed, artifacts, verification evidence, open risks/blockers, next action, and what not to reread. Drop transcripts, full file contents, full diffs, full logs, and conversational detail.
```

## 9. Prompt session mới

Khi session hiện tại quá nặng hoặc gặp API 400, mở session mới với:

```text
Continue this task from artifacts, not old chat history.

Read first:
- docs/reports/<slug>/resume.md
- docs/ACTIVE_STATE.md
- docs/plans/<plan>.md only if the resume packet requires it
- docs/specs/<spec>.md only if the resume packet requires it

Do not reread the whole repo, full diff, old transcript, or all docs.
Do not paste full files/logs/diffs into chat.
Current goal: <next action from resume packet>.
Start by confirming path, phase, current status, and next action in no more than 5 lines.
```

## 10. Giới hạn output sub-agent

Sub-agent có thể đọc rộng, nhưng phải báo cáo hẹp.

Yêu cầu sub-agent chỉ trả:

- status hoặc verdict,
- finding quan trọng nhất,
- summary bằng chứng,
- trích dẫn file/path,
- rủi ro hoặc blocker,
- next actions.

Sub-agent không được trả:

- transcript đầy đủ,
- toàn bộ nội dung file,
- toàn bộ diff,
- toàn bộ log,
- bình luận rộng không liên quan.

## 11. Vệ sinh output tool

Trước khi chạy tool có thể tạo output lớn:

1. thu hẹp file path hoặc search pattern,
2. chỉ yêu cầu dòng hoặc summary cần thiết,
3. tránh đọc generated transcript trừ khi thật sự cần,
4. ưu tiên summary pass/fail cho test,
5. ghi evidence dài vào report thay vì chat.

## 12. Khôi phục sau API 400

Nếu Claude Code trả lỗi API 400 do context window:

1. dừng cố tiếp tục session đã phình to,
2. mở session Claude Code mới,
3. chỉ cung cấp resume packet mới nhất và link artifact,
4. yêu cầu agent tiếp tục theo artifact-first,
5. tránh đọc lại context rộng trừ khi resume packet yêu cầu.
