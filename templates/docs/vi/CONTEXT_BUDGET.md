# Context Budget Protocol

Main Agent là bộ điều khiển workflow, không phải kho chứa transcript. Dùng protocol này để giữ session Claude Code đủ nhẹ để tiếp tục ổn định, đặc biệt trong các việc Standard và Full path kéo dài.

Routing và gate nằm trong [AGENCY_WORKFLOW.md](./AGENCY_WORKFLOW.md). Hành vi theo vai trò nằm trong [TEAM_ROSTER.md](./TEAM_ROSTER.md). State bền vững và artifact resume tuân theo [ARTIFACTS_AND_STORAGE.md](./ARTIFACTS_AND_STORAGE.md).

## 1. Mục đích

## 1.1 Artifact-first tại phase boundary

Bất biến là:

```text
Phase work → bounded handoff artifact → context reset boundary → next phase reads artifact-first
```

Viết một file handoff không tự giảm context. Nó chỉ có tác dụng khi theo sau bởi `/compact`, session mới, handoff cho sub-agent có biên, hoặc workflow boundary nơi chỉ artifact được chuyển tiếp.

Với việc Tiny/Small, tránh ceremony report trừ khi context pressure hoặc nhu cầu evidence yêu cầu. Với Standard/Full, tạo handoff có biên tại phase boundary thật và giữ `resume.md` như con trỏ ngắn tới canonical handoff mới nhất.

Tham khảo đầy đủ: [PHASE_HANDOFF_PROTOCOL.md](./PHASE_HANDOFF_PROTOCOL.md).

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

Với Standard và Full path, cập nhật `docs/reports/YYYY-MM-DD-<slug>/resume.md` tại mọi phase boundary thật để nó trỏ tới canonical handoff mới nhất. Với Tiny/Small, cập nhật `ACTIVE_STATE.md` là đủ trừ khi context pressure, nhu cầu evidence, hoặc một handoff thật yêu cầu report folder.

## 7. Resume packet

Resume packet là điểm vào cho session mới. Nó chỉ trỏ tới thông tin cần đọc; không duplicate mọi handoff.

Lưu tại:

```text
docs/reports/YYYY-MM-DD-<slug>/resume.md
```

Dùng format:

```markdown
# Resume Packet — <Work Item>

## Current pointer
- Latest canonical handoff:
- Current mode:
- Current phase:
- Next action:

## State
- Status: green | yellow | red
- Branch:
- Working tree state:
- Key artifacts:
- Changed files summary:

## Verification
- Last command:
- Result:
- Log path:
- Evidence freshness:

## Open items
- Blockers:
- Risks:
- User decisions needed:

## Context rules for next session
- Read first:
- Read only if needed:
- Do not reread:
- Do not paste:
```

Nếu `resume.md` và approved handoff mới nhất mâu thuẫn, sửa `resume.md` trước khi tiếp tục.

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

## 12. Sanity check

Khi bắt đầu Code, Test, QA hoặc Handover, verify tối thiểu:

```markdown
## Sanity check
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note

Decision: continue | continue-with-warning | stop
```

Hard blocker gồm sai branch, handoff stale, thiếu file bắt buộc, thiếu approval, evidence được claim là hiện tại nhưng cũ hơn thay đổi liên quan, hoặc blocker chưa giải quyết bị đánh dấu complete mà thiếu evidence.

## 13. Evidence freshness

Evidence chỉ hợp lệ khi được tạo sau thay đổi code/config/artifact liên quan, trên branch và working tree mong đợi, có log path được tham chiếu khi output dài.

Trước các handoff Code → Test, Test → QA, hoặc QA → Handover, capture hoặc ghi rõ trạng thái của:

- branch hiện tại,
- `git status`,
- `git diff --name-status`,
- `git diff --stat`,
- `git diff --check`,
- command build/test liên quan,
- impact/change analysis mà project yêu cầu khi code đổi.

Nếu không chạy command, ghi command, lý do, rủi ro và severity.

## 14. Claim cuối

Claim cuối cần evidence mới; mọi claim cuối phải dựa trên evidence mới. Trước khi nói work đã hoàn tất, artifact QA/Handover mới nhất hoặc summary cuối phải thể hiện:

- `git diff --check` pass, nếu code đổi,
- build pass, nếu liên quan,
- test liên quan pass hoặc được skip kèm lý do/rủi ro,
- QA verdict: `pass`, `yellow`, `fail`, hoặc `blocked`,
- rủi ro chưa giải quyết,
- change/impact analysis mà project yêu cầu khi code đổi,
- summary file đã đổi cuối cùng,
- statement về evidence freshness.

Nếu thiếu evidence, nói: `Implemented, but not fully verified because <reason>.`

## 15. Khôi phục sau API 400

Nếu Claude Code trả lỗi API 400 do context window:

1. dừng cố tiếp tục session đã phình to,
2. mở session Claude Code mới,
3. chỉ cung cấp resume packet mới nhất và link artifact,
4. yêu cầu agent tiếp tục theo artifact-first,
5. tránh đọc lại context rộng trừ khi resume packet yêu cầu.
