# Giao thức Bàn giao Giai đoạn v4 — Ranh giới Quy trình An toàn Ngữ cảnh

## Mục đích

Giao thức này ngăn các phiên lập trình AI kéo dài biến lịch sử chat thành kho lưu trữ trạng thái chính.

Giao thức được thiết kế cho các quy trình như:

```text
BA / Discovery → Design / Architecture → Code → Test → Verify / QA → Handover
```

Tại mỗi ranh giới giai đoạn thực sự, giai đoạn hiện tại ghi một artifact bàn giao có giới hạn. Giai đoạn tiếp theo bắt đầu từ một prompt ngắn và đọc artifact trước, không đọc transcript chat cũ.

Giao thức này trực tiếp xử lý các lỗi như:

```text
API Error: 400 Your input exceeds the context window of this model.
```

---

## Tóm tắt vận hành

Đối với việc dùng agent hằng ngày, các quy tắc cốt lõi là:

1. Chọn workflow mode nhỏ nhất phù hợp với tác vụ.
2. Tại ranh giới giai đoạn thực sự, tạo một handoff artifact có giới hạn.
3. Giữ `resume.md` như một con trỏ ngắn, không phải bản tóm tắt trùng lặp.
4. Bắt đầu giai đoạn tiếp theo theo artifact-first, không phải chat-first.
5. Chạy sanity check tối thiểu trước khi tin vào artifact.
6. Lưu logs/diffs/reviews thô trong supporting artifacts, không đặt trong chat hoặc thân handoff.
7. Dùng fresh evidence cho các tuyên bố về code đã đổi, tests hoặc QA.
8. Nếu context pressure ở mức medium/high, hãy compact hoặc bắt đầu fresh session trước giai đoạn tiếp theo.
9. Không tuyên bố hoàn tất nếu thiếu Definition of Done bắt buộc và final verification statement.

Toàn bộ giao thức bên dưới là tài liệu tham khảo. Tài liệu workflow của dự án nên đưa ra checklist vận hành ngắn hơn và liên kết tới đây để xem chi tiết. Không sao chép toàn bộ giao thức này vào nhiều tài liệu luôn được nạp; làm vậy sẽ biến giao thức quản lý context thành context bloat.

---

## Nguyên tắc cốt lõi

```text
Phase work → Bounded handoff artifact → Context reset boundary → Next phase reads artifact-first
```

Handoff không chỉ là bản tóm tắt. Nó là contract giữa các giai đoạn.

Contract phải:

- đủ ngắn để vừa an toàn trong context,
- đủ cụ thể để giai đoạn tiếp theo bắt đầu mà không cần đọc chat cũ,
- có đường dẫn fresh evidence cho các tuyên bố quan trọng,
- rõ ràng về cần đọc gì và không đọc gì,
- rõ về trạng thái approval và ưu tiên source-of-truth,
- được cập nhật, thay thế hoặc đánh dấu stale khi requirements hoặc code thay đổi.

Fresh evidence nghĩa là evidence được tạo sau thay đổi liên quan, trên branch và working tree dự kiến.

---

## Ràng buộc quan trọng

Việc ghi một file handoff `.md` tự nó **không** làm giảm context.

Nó chỉ hữu ích khi sau đó có một context boundary thực sự:

1. `/compact` trong phiên hiện tại,
2. một fresh session,
3. một sub-agent handoff có giới hạn,
4. một ranh giới workflow nơi chỉ artifact được chuyển tiếp.

Nếu cùng một phiên đã phình to vẫn tiếp tục sau khi ghi handoff, các `Messages` cũ vẫn còn trong context và vẫn có thể vượt cửa sổ model.

---

## Điều chỉnh theo công cụ

Giao thức này độc lập với công cụ. Các cơ chế riêng của Claude Code gồm `/compact`, `/context`, sub-agents, and slash-command skills.

Khi công cụ thiếu `/compact` or `/context`, hãy dùng cơ chế tương đương gần nhất:

- fresh session,
- tác vụ agent mới,
- ranh giới artifact đã tóm tắt,
- reset context thủ công,
- checkpoint workflow cục bộ của dự án.

Lệnh và ngưỡng riêng theo công cụ thuộc về tài liệu workflow cục bộ của dự án. Bất biến là tiếp tục theo artifact-first, không phải một lệnh CLI cụ thể.

---

## Artifact-first không có nghĩa là artifact-only

Giai đoạn tiếp theo nên bắt đầu từ `resume.md` và canonical handoff mới nhất, nhưng vẫn phải chạy sanity check tối thiểu với trạng thái repository hiện tại.

Mục tiêu là tránh tái khám phá rộng, không phải tin mù quáng vào artifacts đã stale.

---

## Các mode workflow

Không ép mọi tác vụ phải dùng đầy đủ nghi thức năm giai đoạn.

Chọn mode nhỏ nhất đáp ứng risk, scope và Definition of Done.

| Mode | Dùng khi | Các giai đoạn thường có | Yêu cầu handoff |
|---|---|---|---|
| Tiny | Sửa lỗi chính tả, chỉnh văn bản, cấu hình rất nhỏ, thay đổi rõ ràng chỉ cục bộ | Code → Verify → Handover | Không bắt buộc; chỉ tạo khi xuất hiện áp lực context |
| Small | Thay đổi cục bộ hoặc bugfix có scope rõ ràng | Design-lite → Code → Test/Handover | Một handoff ngắn trước verification nếu cần |
| Standard | Thay đổi hành vi hiện có, refactor, thay đổi nhiều file, bugfix có ý nghĩa | Discovery-lite → Design → Code → Test → QA → Handover | Bắt buộc ở Code → Test và Test → QA; handoff sớm hơn khi phần lập kế hoạch không tầm thường |
| Full | Tính năng mới, thay đổi rộng, công việc risk cao, công việc nhạy cảm về UI/product/security | BA → Design/Architecture → Code → Test → QA/Security/Performance → Handover | Bắt buộc tại mọi ranh giới giai đoạn |

### Cây quyết định nhanh

Dùng đường nhanh này trước khi đọc checklist đầy đủ:

```text
Có thay đổi API, data model, security, auth, payment, permissions hoặc workflow người dùng chính không?
  → Full
Nếu không, có ảnh hưởng hành vi workflow hiện có, refactor shared code hoặc cần tests/review có ý nghĩa không?
  → Standard
Nếu không, đây có phải công việc behavior/config/docs cục bộ trong <= 5 file dự kiến và risk thấp không?
  → Small
Nếu không, đây có phải sửa typo/text/trivial config trong <= 2 file dự kiến với verification rõ ràng không?
  → Tiny
Nếu không
  → Mặc định dùng Standard
```

Checklist bên dưới ghi đè cây nhanh khi nó phát hiện risk cao hơn.

### Checklist chọn mode

Chỉ chọn **Tiny** nếu tất cả điều kiện đúng:

- thay đổi dự kiến <= 2 file,
- không thay đổi contract API/data,
- không thay đổi behavior ngoài UI/text/config cục bộ,
- không ảnh hưởng migration/security/payment/auth/permission,
- verification rõ ràng và rẻ.

Chọn **Small** khi tất cả điều kiện đúng:

- thay đổi behavior mang tính cục bộ,
- thay đổi dự kiến <= 5 file,
- không có dependency xuyên module hoặc thay đổi shared contract,
- rollback đơn giản,
- không ảnh hưởng bề mặt nhạy cảm.

Chọn **Standard** nếu có bất kỳ điều kiện nào đúng:

- thay đổi behavior nhiều file,
- refactor,
- ảnh hưởng workflow hiện có,
- root cause chưa hoàn toàn chắc chắn,
- tests cần thiết kế có ý nghĩa,
- impact analysis được quy tắc dự án yêu cầu,
- QA/review gate là bắt buộc.

Chọn **Full** nếu có bất kỳ điều kiện nào đúng:

- tính năng mới,
- thay đổi architecture/API/data model,
- ảnh hưởng security/payment/auth/permission,
- workflow hướng người dùng thay đổi đáng kể,
- chi phí regression cao,
- công việc xuyên team hoặc kéo dài,
- thiết kế UI/product cần phê duyệt.

### Nâng cấp mode

Nâng cấp mode khi:

- impact/risk tăng,
- số file vượt scope ban đầu,
- yêu cầu của user thay đổi đáng kể,
- tests fail vì lý do chưa rõ sau một vòng sửa,
- tác vụ chuyển từ chỉnh sửa cục bộ sang behavior workflow/design/API,
- áp lực context trở thành medium hoặc high.

Khi mode được nâng cấp:

1. cập nhật mode hiện tại trong `resume.md`,
2. viết `changes/MODE-ESCALATION-<slug>.md` hoặc ghi lý do trong handoff hiện tại,
3. xác định các handoffs/reviews mới cần có,
4. đánh dấu các handoffs trước đó đã bỏ qua là `not applicable` hoặc tạo bù nếu cần,
5. không tiếp tục cho đến khi contract hành động tiếp theo khớp với mode mới.

### Hạ cấp mode

Chỉ hạ cấp khi evidence cho thấy risk/scope ban đầu đã bị đánh giá quá cao.

Ví dụ được phép:

- Standard → Small sau khi impact analysis cho thấy thay đổi là cục bộ và không cần QA gate.
- Full → Standard sau khi tính năng mới được yêu cầu trở thành một chỉnh sửa có giới hạn đối với behavior hiện có.

Khi mode được hạ cấp:

1. cập nhật mode hiện tại trong `resume.md`,
2. ghi lại lý do trong `changes/MODE-DEESCALATION-<slug>.md` hoặc handoff hiện tại,
3. đánh dấu handoffs/reviews không còn bắt buộc là `not applicable`,
4. giữ các artifact evidence đã tạo; không xóa chỉ vì mode đã đổi,
5. không bỏ qua bất kỳ gate nào do dự án yêu cầu nếu gate đó đã áp dụng cho các file đã thay đổi hoặc bề mặt risk.

---

## Ranh giới giai đoạn thực sự

Một ranh giới giai đoạn thực sự xảy ra khi ít nhất một điều đúng:

- bước tiếp theo cần vai trò hoặc tư duy review khác,
- giai đoạn hiện tại tạo ra decision, implementation hoặc test result mà công việc sau phụ thuộc vào,
- nếu tiếp tục mà không tóm tắt thì agent/session tiếp theo phải dựa vào chat memory,
- dự kiến cần user approval hoặc QA gate,
- đã chạm trigger áp lực context,
- sắp vượt qua ranh giới sub-agent/workflow,
- công việc đang chuyển từ planning sang implementation hoặc từ implementation sang verification.

Không phải ranh giới giai đoạn thực sự:

- chuyển qua lại giữa hai chỉnh sửa nhỏ trong cùng một bước implementation,
- chạy lại command fail sau một fix tầm thường,
- đọc thêm một file được tham chiếu,
- cập nhật lỗi typo trong cùng artifact,
- thực hiện chỉnh sửa follow-up cục bộ không thay đổi phase contract.

Không tạo handoffs chỉ để có nghi thức. Hãy tạo khi chúng bảo toàn tính đúng đắn hoặc an toàn context.

---

## Mô hình status, verdict và severity

### Workflow status

Dùng workflow status cho tiến trình tổng thể của giai đoạn:

- `green` — có thể tiếp tục bình thường.
- `yellow` — có thể tiếp tục với risks đã biết, evidence thiếu nhưng không blocking, hoặc gaps đã được chấp nhận.
- `red` — không nên tiếp tục cho đến khi đã fix hoặc được user/lead chấp nhận rõ ràng.

### QA verdict

Dùng QA verdict cho kết quả review:

- `pass` — được chấp nhận, không có finding blocking.
- `yellow` — được chấp nhận với risks/gaps đã document.
- `fail` — findings cần được fix trước handover.
- `blocked` — QA không thể hoàn tất vì thiếu evidence, environment, approval hoặc artifact bắt buộc.

### Severity

Dùng severity cho risks, blockers và findings:

- `critical` — phải dừng; không thể tiếp tục nếu chưa fix hoặc chưa có ngoại lệ rõ ràng.
- `high` — phải fix trước handover trừ khi được chấp nhận rõ ràng.
- `medium` — chỉ có thể tiếp tục với risk/owner/mitigation đã document.
- `low` — chỉ ghi chú; thông thường không block.

Ánh xạ:

- `critical` chưa resolve hoặc `high` chưa được chấp nhận → workflow status `red` hoặc QA verdict `fail/blocked`,
- `medium` chưa resolve → workflow status `yellow` trừ khi được chấp nhận là không còn risk,
- chỉ còn `low` chưa resolve → thường là `green` hoặc `yellow` tùy context.

Tránh các tổ hợp mơ hồ. Nếu `Status: green` và `QA verdict: yellow`, hãy giải thích vì sao QA gaps không blocking.

Phân biệt vận hành:

- Dùng `Approval: blocked` khi giai đoạn không thể tiếp tục vì thiếu approval hoặc thiếu quyết định của user/lead.
- Dùng `Status: red` khi trạng thái công việc không an toàn, sai, stale hoặc chưa sẵn sàng để tiếp tục.
- Dùng `QA verdict: blocked` khi QA không thể đánh giá vì thiếu evidence, environment hoặc access.
- Dùng `critical | high | medium | low` cho từng risk, blocker và finding riêng lẻ.

---

## Canonical artifacts và supporting artifacts

Canonical artifacts là đầu vào contract cho giai đoạn tiếp theo:

- `resume.md`,
- handoff mới nhất nằm trực tiếp dưới `handoffs/`,
- change requests hoặc amendments đã được approved và ảnh hưởng giai đoạn hiện tại.

Supporting artifacts là evidence hoặc chi tiết:

- `logs/`,
- `reviews/`,
- `decisions/`,
- `artifacts/`,
- `archive/`.

Giai đoạn tiếp theo đọc canonical artifacts trước. Nó chỉ đọc supporting artifacts khi canonical artifact tham chiếu tới chúng và cần chi tiết đó.

---

## Bố cục artifact khuyến nghị

Với mỗi work item không tầm thường, dùng bố cục này khi cần:

```text
docs/reports/YYYY-MM-DD-<slug>/
  resume.md
  handoffs/
    01-ba-to-design.md
    02-design-to-code.md
    03-code-to-test.md
    04-test-to-qa.md
    05-qa-to-handover.md
  logs/
  reviews/
  decisions/
  changes/
  artifacts/
  archive/
```

Vai trò thư mục:

- `resume.md` — pointer ngắn tới state mới nhất và next action.
- `handoffs/` — canonical phase contracts. Một file cho mỗi boundary.
- `logs/` — raw command output và stack traces dài.
- `reviews/` — code review, security review, QA review, visual QA.
- `decisions/` — ADRs hoặc decisions architecture/product quan trọng.
- `changes/` — user change requests, amendments, mode escalation/de-escalation notes.
- `artifacts/` — PRD, API contract, test matrix, design notes, generated reports.
- `archive/` — các phiên bản handoff đã bị supersede.

Không tạo thư mục rỗng hoặc placeholder artifacts trừ khi quy ước dự án yêu cầu. Chỉ tạo thư mục hỗ trợ khi chúng được dùng.

Không đặt logs đầy đủ, diffs đầy đủ, files đầy đủ, secrets, dữ liệu nhạy cảm hoặc transcripts cũ trong handoff files.

### Optional artifact index for Full mode

Với Full mode hoặc công việc kéo dài, một index nhẹ tùy chọn có thể giúp điều hướng:

```text
docs/reports/YYYY-MM-DD-<slug>/index.md
```

Chỉ dùng khi `resume.md` nếu không sẽ trở nên quá chật.

Template:

```markdown
# Artifact Index — <Work Item>

## Canonical
- `resume.md`:
- `handoffs/<latest>.md`:
- `changes/<approved-cr>.md`:

## Supporting
- `logs/...`:
- `reviews/...`:
- `decisions/...`:
- `artifacts/...`:

## Archived
- `archive/...`:
```

Quy tắc:

- Giữ `index.md` nhẹ.
- Không duplicate nội dung handoff.
- Không tạo cho công việc Tiny/Small trừ khi convention của dự án yêu cầu.

---

## Quy ước đặt tên

Report slug:

- dùng lowercase-kebab-case,
- ngắn và ổn định,
- cụ thể theo tác vụ,
- không dùng tiêu đề ticket dài; ưu tiên 3–8 từ.

Ví dụ:

```text
docs/reports/2026-06-07-checkout-flow/
```

Tên file log:

```text
logs/YYYYMMDD-HHMM-<sanitized-command-name>.log
```

Ví dụ:

```text
logs/20260607-1430-npm-test.log
logs/20260607-1445-git-diff-check.log
```

Quy tắc:

- sanitize tên command,
- tránh ghi đè logs trước đó trừ khi có chủ ý,
- nếu ghi đè là có chủ ý, hãy nói rõ trong command summary,
- giữ log path ổn định trong evidence records.

---

## Ngân sách đọc và ghi artifact

Có giới hạn nghĩa là cả artifacts được đọc và artifacts được ghi đều có giới hạn.

### Read budget

Read budget mặc định cho giai đoạn tiếp theo:

```text
Tiny/Small: resume.md + latest handoff + at most 2 referenced files
Standard:   resume.md + latest handoff + at most 5 referenced files/artifacts
Full:       resume.md + latest handoff + at most 8 referenced files/artifacts
```

Không mặc định đọc tất cả handoffs. Đọc canonical handoff mới nhất, rồi chỉ đọc handoffs cũ hơn nếu handoff mới nhất yêu cầu rõ ràng.

Định dạng ngoại lệ read budget:

```markdown
## Read budget exception
- Original budget:
- Additional files/artifacts needed:
- Reason:
- Narrowing strategy:
- Stop condition:
```

### Write budget

Supporting artifact budget mặc định:

| Mode | Write budget mặc định |
|---|---|
| Tiny | Tránh report folder trừ khi cần; không tạo thư mục rỗng |
| Small | Tối đa 1 handoff; chỉ lưu logs cho commands nhiều nhiễu |
| Standard | Handoffs bắt buộc + logs/reviews chỉ khi dùng |
| Full | Được phép dùng cấu trúc đầy đủ, nhưng chỉ tạo artifacts có nội dung |

Không tạo artifacts để trông có vẻ kỹ lưỡng. Hãy tạo khi chúng bảo toàn evidence, decisions hoặc an toàn context.

---

## Giới hạn kích thước artifact

Mục tiêu token được ưu tiên. Giới hạn dòng chỉ là tín hiệu về mật độ.

Nếu một artifact vẫn dưới giới hạn dòng nhưng có khả năng vượt mục tiêu token vì JSON, code, stack traces, schemas hoặc đoạn văn dài quá dày đặc, hãy chuyển nội dung dày sang supporting artifact và giữ handoff ngắn.

### Mục tiêu kích thước

| Artifact | Kích thước mục tiêu |
|---|---:|
| `resume.md` | <= 1k tokens |
| Tiny handoff | <= 1.5k tokens |
| Small handoff | <= 2.5k tokens |
| `01-ba-to-design.md` | <= 4k tokens |
| `02-design-to-code.md` | <= 8k tokens |
| `03-code-to-test.md` | <= 5k tokens |
| `04-test-to-qa.md` | <= 4k tokens |
| `05-qa-to-handover.md` | <= 4k tokens |

Giới hạn dòng dự phòng:

| Artifact | Số dòng tối đa |
|---|---:|
| `resume.md` | 150 |
| Tiny handoff | 150 |
| Small handoff | 250 |
| BA→Design | 400 |
| Design→Code | 600 |
| Code→Test | 400 |
| Test→QA | 300 |
| QA→Handover | 300 |

Quy tắc mật độ:

- ưu tiên bullets ngắn,
- tránh đoạn văn dài hơn 5 dòng,
- tránh paste JSON/code trừ snippets rất nhỏ,
- không paste stack traces,
- nếu một section có vẻ dày, chuyển chi tiết sang supporting artifact và link tới đó.

Giới hạn section:

- tối đa 10 decisions,
- tối đa 30 bullets về file đã đổi,
- tối đa 1–2 dòng cho mỗi file đã đổi,
- tối đa 10 command summaries,
- tối đa 3–5 lỗi hàng đầu cho mỗi command,
- tối đa 10 risks hoặc blockers,
- tối đa 10 file citations trừ khi review artifact giữ danh sách chi tiết.

---

## Vệ sinh bảo mật và quyền riêng tư

Không đưa vào handoffs:

- secrets, tokens, API keys,
- credentials,
- environment variables đầy đủ,
- dữ liệu cá nhân/khách hàng trừ khi được yêu cầu rõ ràng và đã minimize,
- raw production logs có dữ liệu nhạy cảm,
- connection strings,
- private URLs trừ khi policy dự án cho phép,
- screenshots hoặc media chứa dữ liệu riêng tư.

Nếu evidence chứa dữ liệu nhạy cảm:

- lưu một summary đã redact,
- chỉ tham chiếu secure location nếu policy dự án cho phép,
- đánh dấu yêu cầu access,
- không paste sensitive evidence vào chat.

---

## Thứ tự ưu tiên source-of-truth

Khi các nguồn xung đột, dùng thứ tự ưu tiên này:

1. chỉ dẫn rõ ràng mới nhất của user làm thay đổi requirements hoặc constraints,
2. handoff approved mới nhất hoặc amendment approved mới nhất,
3. source artifact được tham chiếu: PRD, technical design, ADR, test matrix, API contract,
4. evidence hiện tại từ code và command,
5. handoffs cũ hơn,
6. chat history cũ, chỉ khi được cho phép rõ ràng.

Không phải mọi chỉ dẫn của user đều giống nhau:

- Chỉ dẫn làm thay đổi requirement có thể supersede một handoff approved, nhưng phải được ghi lại thành change request hoặc handoff update trước khi tiếp tục công việc.
- Chỉ dẫn về process/style ảnh hưởng cách thực thi, nhưng không tự động thay đổi product/technical contract.
- Một nhận xét hoặc clarification casual không nên âm thầm invalidate artifact approved; hãy chuyển nó thành change request rõ ràng nếu nó thay đổi scope.

Nếu xung đột có ý nghĩa và chưa được giải quyết, đánh dấu handoff là `blocked`.

---

## Trạng thái approval và approval evidence

Mọi handoff phải khai báo approval status:

```text
Approval: draft | approved | auto-approved | blocked
Approved by:
Approval evidence:
Approval note:
```

Ý nghĩa:

- `draft` — do agent viết, chưa phải contract ổn định.
- `approved` — được user/lead approve rõ ràng hoặc được chấp nhận qua một gate.
- `auto-approved` — chấp nhận được cho công việc Tiny/Small khi không cần gate.
- `blocked` — không thể dùng cho giai đoạn tiếp theo cho đến khi câu hỏi hoặc vấn đề được resolve.

Quy tắc:

- `approved` cần evidence: user message, kết quả Plan Mode gate, approval PR/MR hoặc một decision artifact được tham chiếu.
- Agent chỉ được đặt `auto-approved` khi mode đã chọn cho phép và không còn quyết định user nào đang pending.
- `Approved by: user` không hợp lệ nếu thiếu `Approval evidence`.
- Nếu không thể verify approval, dùng `draft` hoặc `blocked`, không dùng `approved`.

Ví dụ:

```text
Approval evidence: User message "Approved, proceed with implementation" on 2026-06-07
Approval evidence: Plan Mode approval for docs/plans/checkout-flow.md
Approval evidence: PR #123 approved by <name>
Approval evidence: decisions/ADR-002.md
```

---

## Base handoff template

Mọi handoff bắt đầu bằng phần base này.

Trạng thái section:

- Bắt buộc: phải xuất hiện.
- Bắt buộc khi áp dụng: include khi phase/risk/scope khiến nó liên quan; nếu không, chỉ ghi `Not applicable` khi có khả năng gây mơ hồ.
- Tùy chọn: chỉ include khi hữu ích.

```markdown
# Phase Handoff — <From Phase> → <To Phase>

## Status [Required]
- Work item:
- Mode: tiny | small | standard | full
- From phase:
- To phase:
- Status: green | yellow | red
- Approval: draft | approved | auto-approved | blocked
- Approved by:
- Approval evidence:
- Approval note:
- Branch:
- Base commit:
- Working tree state:
- Evidence captured against:
- Last updated:

## Source of truth [Required]
- Latest user instruction:
- Latest approved handoff/amendment:
- Referenced artifacts:
- Evidence paths:

## Read first [Required]
- `docs/reports/<slug>/resume.md`
- this handoff
- required files:

## Do not read [Required]
- old transcripts
- full logs unless debugging a listed failure
- full diffs unless a specific hunk is requested
- broad docs unless listed under required files

## Next action [Required]
- Next role:
- Objective:
- Stop condition:
- Required tools/skills:
```

Định dạng định danh evidence chuẩn:

```text
Evidence captured against: branch <name>, commit <hash|none>, working tree <clean|dirty>, diff summary <path|none>, captured at <YYYY-MM-DD HH:MM local>
```

Chỉ thêm các section riêng theo giai đoạn có áp dụng.

---

## Templates riêng theo giai đoạn

### BA / Discovery → Design / Architecture

File:

```text
handoffs/01-ba-to-design.md
```

Bắt buộc:

```markdown
## Product context [Required]
- User-facing goal:
- Personas/users:
- Business flows:
- Success criteria:
- Non-goals:

## Requirements [Required]
- Acceptance criteria:
- Edge cases:
- Constraints:
- Assumptions:
- Open product questions:
```

Bắt buộc khi áp dụng:

```markdown
## Design input [Required when applicable]
- Screens or flows needed:
- UX constraints:
- Content/help requirements:
- Sensitive data or security notes:
```

Không đưa implementation details vào trừ khi chúng là hard constraints.

---

### Design / Architecture → Code

File:

```text
handoffs/02-design-to-code.md
```

Bắt buộc:

```markdown
## Implementation contract [Required]
- Architecture approach:
- API/module/interface contract:
- Data contract:

## Task list [Required]
- [ ] Task:
- [ ] Task:

## Test strategy [Required]
- Unit tests:
- Integration tests:
- Manual checks:
- Regression focus:
```

Bắt buộc khi áp dụng:

```markdown
## Specialized constraints [Required when applicable]
- UI/design contract:
- Security constraints:
- Performance constraints:

## Impact analysis [Required when applicable]
- Symbol/area:
- Risk level:
- Direct callers/affected flows:
- Required precautions:
```

Tùy chọn:

```markdown
## Files likely to change [Optional]
- `path`: reason
```

Không đưa design direction mới vào Code trừ khi blocker buộc phải có amendment.

---

### Code → Test

File:

```text
handoffs/03-code-to-test.md
```

Bắt buộc:

```markdown
## Changed files [Required]
- `path`: purpose

## Commands already run [Required]
- Command:
  - Result:
  - Exit code:
  - Log path:
  - Top errors, if failed:

## Test focus [Required]
- Case:
  - Expected result:
  - Related files:
```

Bắt buộc khi áp dụng:

```markdown
## Implementation notes [Required when applicable]
- Decision/note:
- Known limitation:

## Known risks [Required when applicable]
- Risk:
  - Severity:
  - Why it matters:
  - Suggested test:
```

Không lặp lại toàn bộ product hoặc architecture context trừ khi nó ảnh hưởng trực tiếp tới testing.

---

### Test → Verify / QA

File:

```text
handoffs/04-test-to-qa.md
```

Bắt buộc:

```markdown
## Test evidence [Required]
- Command:
  - Status: passed | failed | skipped
  - Exit code:
  - Log path:
  - Top errors:

## QA scope [Required]
- Review focus:
- Files to inspect:
- Risks to challenge:
- Coverage limit:
- If more than 5 findings are found:
```

Bắt buộc khi áp dụng:

```markdown
## Fixes after test failures [Required when applicable]
- Failure:
- Fix:
- Evidence:

## Remaining gaps [Required when applicable]
- Not tested:
- Reason:
- Risk:
- Severity:
```

QA nên xác minh claims trong handoff này, không tái khám phá toàn bộ dự án.

---

### Verify / QA → Handover

File:

```text
handoffs/05-qa-to-handover.md
```

Bắt buộc:

```markdown
## QA verdict [Required]
- Verdict: pass | yellow | fail | blocked
- Reviewer:
- Review report path:

## Final verification [Required]
- Command:
  - Result:
  - Exit code:
  - Log path:

## User-facing summary [Required]
- What changed:
- What was verified:
- What was not verified:
```

Bắt buộc khi áp dụng:

```markdown
## Confirmed findings [Required when applicable]
- Finding:
  - Severity:
  - Evidence:
  - Resolution:

## Release/merge recommendation [Required when applicable]
- Recommendation:
- Conditions:
- Unresolved risks:
```

Main Agent phải đưa ra final claims từ evidence này, không từ memory.

---

## Template file resume

`resume.md` là entry point cho fresh-session. Nó trỏ tới thông tin cần đọc; nó không kể lại mọi thứ.

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

Quy tắc:

- Giữ `resume.md` dưới target size.
- Không duplicate mọi handoff.
- Cập nhật nó mỗi khi canonical handoff thay đổi.
- Nếu `resume.md` và handoff approved mới nhất xung đột, hãy fix `resume.md` trước khi tiếp tục.

---

## Công việc non-code

Nếu không có code thay đổi, thay code-oriented evidence bằng artifact-oriented evidence.

Ví dụ về công việc non-code:

- PRD/spec review,
- architecture review,
- documentation update,
- prompt/workflow design,
- planning artifact creation,
- research report.

Quy tắc:

- thay evidence `git diff` bằng artifact diff hoặc document change summary khi phù hợp,
- build/test commands có thể là `not applicable`,
- verification có thể là review, lint, link check, markdown check hoặc user approval,
- final claims vẫn phải nêu rõ điều gì đã và chưa được verify,
- dùng mode DoD, nhưng đánh dấu các check riêng cho code là `not applicable` kèm lý do.

---

## Change requests và amendments

Khi user đổi requirements giữa chừng, tạo một change artifact:

```text
changes/CR-001-<slug>.md
```

Template:

```markdown
# Change Request CR-001 — <Title>

## Source
- User instruction:
- Date/session:

## Change
- Previous requirement/contract:
- New requirement/contract:

## Impact
- Affected phases:
- Affected files/contracts:
- Required rework:
- Tests/reviews to repeat:

## Handoff update
- Canonical handoff to update:
- Archive created:
- Approval required: yes | no
```

Quy tắc:

- Nếu change ảnh hưởng contract, cập nhật canonical handoff.
- Nếu change invalidate công việc design/code/test trước đó, đánh dấu các affected phases trong `resume.md`.
- Không tiếp tục với stale handoff sau một material change.

---

## Versioning, archive và garbage collection

Tránh cách đặt tên kiểu `final-final-v3.md`.

Canonical files giữ tên ổn định:

```text
handoffs/02-design-to-code.md
```

Phiên bản bị thay thế đưa vào archive:

```text
archive/02-design-to-code.v1.md
archive/02-design-to-code.v2.md
```

Khi cập nhật canonical handoff:

1. copy phiên bản canonical cũ vào `archive/`,
2. cập nhật canonical file trong `handoffs/`,
3. cập nhật `resume.md`,
4. tạo hoặc cập nhật artifact `changes/CR-*.md` khi lý do là requirement hoặc contract change,
5. đánh dấu downstream phase artifacts là stale khi update invalidate chúng.

Không âm thầm sửa canonical handoff đã được dùng. Nếu một giai đoạn sau đã consume nó, material update cần archive + change note + downstream stale marking.

Mặc định garbage collection:

- giữ 3 archived versions mới nhất cho mỗi canonical handoff,
- giữ vĩnh viễn archive versions được CR, PR, release note hoặc incident tham chiếu trừ khi bị xóa thủ công,
- chỉ xóa khi có permission rõ ràng từ user/project,
- nếu cần cleanup, viết cleanup summary trước khi xóa.

Canonical handoff mới nhất luôn là file nằm trực tiếp dưới `handoffs/`.

---

## Quy tắc concurrency

Khi nhiều agents hoặc workflows có thể ghi artifacts:

Trước khi ghi canonical artifacts:

- kiểm tra latest pointer hiện tại trong `resume.md`,
- kiểm tra canonical handoff có thay đổi kể từ khi được đọc hay không,
- tránh ghi song song vào cùng một canonical file,
- ghi supporting artifacts trước, rồi cập nhật canonical handoff, rồi cập nhật `resume.md`,
- nếu có conflict, viết conflict note dưới `changes/` và dừng để reconciliation.

Không bao giờ để hai agents độc lập cập nhật `resume.md` hoặc cùng một canonical handoff mà không reconciliation.

---

## Phát hiện stale handoff

Một handoff bị stale nếu có bất kỳ điều nào đúng:

- user thay đổi requirements sau thời điểm `Last updated` của handoff,
- git diff thay đổi sau khi Code → Test handoff được viết,
- test results cũ hơn thay đổi code/config/artifact liên quan mới nhất,
- `resume.md` trỏ tới canonical handoff khác,
- một CR artifact nói handoff này phải được cập nhật,
- branch đã đổi kể từ khi handoff được tạo,
- working tree state không còn khớp với `Evidence captured against`,
- approval gate bị thu hồi hoặc supersede.

Nếu stale:

1. dừng phase transition,
2. cập nhật hoặc archive handoff,
3. cập nhật `resume.md`,
4. chạy lại affected evidence nếu cần,
5. chỉ sau đó mới tiếp tục.

---

## Độ mới của evidence

Evidence chỉ hợp lệ nếu:

- nó được tạo sau thay đổi code/config/artifact liên quan,
- command chạy trên branch dự kiến,
- command chạy với working tree hoặc commit dự kiến,
- log path được tham chiếu,
- commands bị skip có reason và risk,
- downstream changes không invalidate nó.

Nếu evidence đã cũ nhưng vẫn hữu ích, hãy label là historical, không phải current verification.

---

## Ngăn evidence và artifact drift

Không để handoffs drift khỏi thực tế code.

Claims quan trọng cần đường dẫn fresh evidence.

Không tốt:

```markdown
Tests passed.
```

Tốt:

```markdown
- Command: npm test
- Result: passed
- Exit code: 0
- Log path: docs/reports/<slug>/logs/20260607-1430-npm-test.log
- Evidence captured against: branch feature/checkout-flow, commit none, working tree dirty, diff summary docs/reports/<slug>/logs/20260607-1425-git-diff-name-status.log, captured at 2026-06-07 14:30 local
```

Trước khi viết handoffs Code → Test, Test → QA hoặc QA → Handover, hãy capture hoặc đánh dấu rõ trạng thái của:

- branch hiện tại,
- `git status`,
- `git diff --name-status`,
- `git diff --stat`,
- `git diff --check`,
- build/test commands liên quan,
- impact/change analysis do dự án yêu cầu khi code thay đổi.

Nếu một command không được chạy, hãy ghi:

```markdown
Not run:
- Command:
- Reason:
- Risk:
- Severity:
```

Không để agent dựa vào memory cho changed files, test status hoặc QA verdict.

---

## Sanity check tối thiểu cho giai đoạn tiếp theo

Artifact-first không có nghĩa là tin artifacts một cách mù quáng.

Khi bắt đầu Code, Test, QA hoặc Handover, tối thiểu hãy verify:

- branch hiện tại đúng như dự kiến,
- `git status` đã được hiểu rõ,
- canonical handoff mới nhất chưa bị supersede,
- các file bắt buộc tồn tại,
- summary changed files khớp với handoff,
- package/build/test commands liên quan tồn tại khi cần,
- open blockers không bị đánh dấu đã resolve nếu thiếu evidence.

### Sanity check output format

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

Blocker cứng:

- sai branch cho tác vụ,
- canonical handoff mới nhất bị stale hoặc supersede,
- thiếu file bắt buộc,
- cần user approval nhưng chưa có,
- evidence được claim là hiện tại nhưng cũ hơn thay đổi code liên quan,
- blocker chưa resolve bị đánh dấu hoàn tất khi thiếu evidence.

Cảnh báo:

- optional command không sẵn có,
- thiếu supporting artifact không critical,
- cần manual verification nhưng chưa chạy,
- mismatch nhỏ không ảnh hưởng bước tiếp theo.

Không đọc rộng repository trừ khi sanity check phát hiện mismatch cần điều tra rộng hơn.

---

## Lập kế hoạch context chủ động

Đừng chờ tới khi context đã phình to.

Trước khi bắt đầu một phase, ước lượng context risk:

```markdown
## Context plan
- Phase:
- Expected files/artifacts to read:
- Expected commands:
- Expected sub-agents:
- Risk: low | medium | high
- Boundary plan: continue | compact first | fresh session | sub-agent boundary
```

### Bảng quyết định boundary

| Tình huống | Boundary plan |
|---|---|
| Messages < 80k và phase tiếp theo là Tiny/Small | continue |
| Messages 80k–120k và phase tiếp theo nhỏ/cục bộ | compact first |
| Messages 80k–120k và phase tiếp theo cần exploration/review rộng | fresh session or sub-agent boundary |
| Messages 120k–150k | create handoff, then compact first or fresh session |
| Messages 150k+ | create handoff if possible, then fresh session |
| Gần giới hạn hoặc API 400 | fresh session from artifacts; không tiếp tục context cũ |
| Bước tiếp theo là QA/review độc lập | sub-agent boundary từ handoff mới nhất |
| Phase tiếp theo cần vai trò khác và context hiện tại nhiễu | fresh session or sub-agent boundary |
| Tool thiếu metrics compact/context | fresh session khi risk là medium/high |

Dùng `compact first` khi session hiện tại vẫn dùng được và phase tiếp theo ngắn.

Dùng `fresh session` khi phase tiếp theo dài, đổi vai trò, rộng, hoặc `Messages` hiện tại đã cao.

Dùng `sub-agent boundary` khi bước tiếp theo có thể scope độc lập và nên trả về verdict/report có giới hạn.

---

## Context circuit breaker

Tạo hoặc cập nhật handoff trước khi tiếp tục khi bất kỳ trigger nào xảy ra:

- đã đến phase boundary,
- `/context` hiển thị `Messages` trên 120k trên model 200k,
- file reads vượt 50k tokens,
- một command trả về output dài,
- một sub-agent trả về response dài,
- đã có hơn 5 tool calls đáng kể kể từ checkpoint gần nhất,
- review/fix loop lặp lại hơn một lần,
- sắp bắt đầu exploration rộng trong repo,
- đã đọc hơn N source files lớn cho phase hiện tại,
- git diff lớn hoặc trải rộng nhiều file,
- phase kéo dài qua nhiều work sessions,
- xuất hiện các hướng solution cạnh tranh,
- user thay đổi requirements,
- task mode được nâng cấp,
- sắp launch một specialized sub-agent,
- Claude Code trở nên chậm, confused hoặc mất state,
- user báo cáo context pressure,
- Claude Code trả về lỗi API 400 context-window.

Ngưỡng khuyến nghị cho model context 200k:

```text
Messages < 80k       normal
80k–120k             be careful; avoid broad reads
120k–150k            checkpoint + compact soon
150k+                create handoff and prefer fresh session
Near limit / 400     current session may not recover; use fresh session from artifacts
```

Đừng dựa vào việc dừng êm sau khi đã vượt giới hạn model. Đường phục hồi là một fresh session từ artifacts.

Trước khi exploration rộng trong repo, hãy tạo exploration plan và output cap.

---

## Phục hồi sau lỗi context-window

Nếu xảy ra lỗi API 400 context-window:

1. dừng công việc rộng ngay lập tức,
2. không paste transcript trước đó vào prompt mới,
3. bắt đầu một fresh session,
4. đọc `resume.md` trước,
5. đọc canonical handoff mới nhất,
6. chạy sanity check tối thiểu,
7. tiếp tục từ next action đã ghi lại.

Nếu không có handoff:

1. tạo `resume.md` phục hồi tối thiểu từ các file có sẵn và trạng thái repository,
2. không reconstruct lịch sử dài từ memory trừ khi không thể tránh,
3. đánh dấu confidence là `low`,
4. liệt kê decisions/evidence còn thiếu,
5. chỉ hỏi các câu hỏi blocking,
6. tiếp tục với context plan nhỏ.

### Các mức recovery confidence

- `high` — đã biết branch, đã hiểu working tree, có handoff mới nhất hoặc artifact tương đương, có thể verify changed files, và evidence mới nhất còn fresh.
- `medium` — đã biết branch và changed files, nhưng thiếu hoặc cũ một số evidence/artifacts.
- `low` — không có handoff dùng được, trạng thái được reconstruct chủ yếu từ git status/files, thiếu decisions của user, hoặc không thể verify độ mới của evidence.

Recovery resume tối thiểu:

```markdown
# Recovery Resume — <Work Item>

## Confidence
- Level: low | medium | high
- Reason:

## Known state
- Branch:
- Working tree summary:
- Known changed files:
- Known artifacts:

## Missing evidence
- Missing:
- Risk:
- Severity:

## Next safe action
- Action:
- Stop condition:
```

---

## Quy tắc output của công cụ

Commands nhiều nhiễu phải ghi raw output vào files, không đưa vào chat.

Mẫu ưu tiên:

```text
1. chạy command,
2. ghi full output vào docs/reports/<slug>/logs/<timestamp>-<command>.log,
3. chỉ in command summary.
```

Định dạng tóm tắt command:

```markdown
### <command>
- Exit code:
- Status: passed | failed | skipped
- Log: docs/reports/<slug>/logs/<timestamp>-<command>.log
- Top errors:
  1.
  2.
  3.
```

Quy tắc:

- top errors: tối đa 3–5,
- stack trace ở lại trong log file,
- full diff không đưa vào chat,
- full test output không đưa vào chat,
- broad search output phải được giới hạn.

Dùng summary commands trước:

```text
git diff --stat
git diff --name-status
git diff --check
```

Chỉ inspect các hunks cụ thể sau khi summary xác định cần xem ở đâu.

---

## Quy tắc đọc file

Giai đoạn tiếp theo chỉ đọc những gì handoff yêu cầu.

Ưu tiên:

- ranges file có mục tiêu,
- lookup ở symbol-level,
- search theo path cụ thể,
- artifacts đã được summarize,
- report files.

Tránh:

- đọc toàn bộ files lớn,
- đọc toàn bộ directories,
- đọc lại docs đã được summarize trong handoff,
- đọc raw logs trừ khi debugging một failure đã liệt kê,
- đọc sub-agent transcripts.

Nếu có vẻ cần đọc rộng, trước tiên hãy hỏi:

```text
What exact question am I trying to answer, and can a narrower artifact or search answer it?
```

---

## Quy tắc output của sub-agent

Sub-agents có thể inspect rộng hơn Main Agent khi vai trò yêu cầu, nhưng phải bắt đầu từ handoff, dùng targeted exploration trước và report hẹp.

Giới hạn output mặc định:

```text
- verdict: pass | fail | blocked | needs-review
- max 5 primary findings in the chat response
- max 10 file citations in the chat response
- max 1 short evidence paragraph per finding
- commands run and summary only
- report/log paths for detail
- no full logs
- no full diffs
- no full file contents
- no transcript
```

Quy tắc coverage:

- Nếu QA tìm thấy hơn 5 issues, chat response liệt kê top 5 theo severity và ghi danh sách findings đầy đủ vào `reviews/qa-review.md`.
- Main Agent nên chỉ đọc summary trước.
- Main Agent chỉ đọc full review artifact nếu cần fix hoặc adjudicate một finding cụ thể.
- Response cap có giới hạn không phải coverage cap; đó là chat-output cap.

---

## Prompt cho QA sub-agent

Dùng phần này cho Verify / QA:

```text
You are the QA reviewer for this task.

Read first:
- docs/reports/<slug>/resume.md
- docs/reports/<slug>/handoffs/04-test-to-qa.md

Run the structured sanity check using this exact format:
- Branch: pass | warn | block — note
- Working tree: pass | warn | block — note
- Canonical handoff freshness: pass | warn | block — note
- Required files exist: pass | warn | block — note
- Changed files summary: pass | warn | block — note
- Required commands available: pass | warn | block — note
- Open blockers: pass | warn | block — note
- Decision: continue | continue-with-warning | stop

Read implementation files only when needed to verify a specific claim or finding.
Do not reread broad repository context.
Do not paste full logs, full diffs, full files, or transcript.

Return only:
- verdict: pass | yellow | fail | blocked,
- top 5 findings by severity,
- evidence summary,
- file:line citations,
- required fixes,
- commands run and result,
- report/log paths.

If evidence or findings are long, write them to docs/reports/<slug>/reviews/qa-review.md and return only the path plus summary.
```

---

## Prompt ngắn cho giai đoạn tiếp theo

Dùng phần này khi mở một fresh session hoặc hand off cho sub-agent:

```text
Continue this task artifact-first, not chat-first.

Read first:
- docs/reports/<slug>/resume.md
- docs/reports/<slug>/handoffs/<latest-canonical-handoff>.md

Do not read old transcripts, full logs, full diffs, or broad docs.
Read referenced files only if the handoff says they are required.
Do not paste full files/logs/diffs into chat.

Start with the structured sanity check, then confirm in <= 5 lines:
- mode,
- current phase,
- status,
- latest handoff,
- next action.
```

---

## Definition of Done theo mode

Definition of Done quyết định liệu công việc có thể được xem là hoàn tất hay không. Final verification contract quyết định completion claim phải được phát biểu như thế nào.

### Tiny

- change đã được thực hiện,
- changed files khớp với scope đã mô tả,
- manual hoặc obvious verification đã được ghi chú,
- không còn blocker chưa resolve,
- không có risks hoặc risks đã được liệt kê kèm severity.

### Small

- có summary changed files,
- test/build/manual check liên quan đã chạy hoặc đã skip kèm lý do,
- không còn blocker chưa resolve,
- final response nêu rõ điều gì đã và chưa được verify.

### Standard

- có Code → Test handoff bắt buộc,
- có Test → QA handoff bắt buộc,
- có relevant tests/build evidence hoặc skipped commands có reason/risk,
- QA verdict là `pass`, `yellow`, `fail`, hoặc `blocked`,
- unresolved risks đã được liệt kê,
- impact/change analysis do dự án yêu cầu đã hoàn tất khi áp dụng.

### Full

- tất cả phase handoffs bắt buộc tồn tại hoặc được đánh dấu rõ là not applicable,
- approval gates đã được đáp ứng,
- QA/security/performance review đã hoàn tất khi áp dụng,
- release/merge recommendation đã document,
- final handover artifact tồn tại,
- unresolved risks và các khu vực chưa verify đã được liệt kê.

---

## Final verification contract trước tuyên bố cuối

Section này không thay thế Definition of Done. Nó kiểm soát format và evidence cần có cho final user-facing claim.

Trước khi Main Agent nói công việc đã hoàn tất, QA/Handover artifact mới nhất hoặc final summary phải thể hiện:

- `git diff --check` đã pass, nếu code thay đổi,
- build đã pass, nếu dự án có build command liên quan,
- relevant tests đã pass, hoặc liệt kê rõ tests không chạy kèm reason/risk,
- QA verdict: `pass`, `yellow`, `fail`, hoặc `blocked`,
- unresolved risks đã được liệt kê,
- change/impact analysis do dự án yêu cầu khi code thay đổi,
- final changed files summary,
- statement về độ mới của evidence.

Nếu thiếu bất kỳ evidence nào, final response phải nói:

```text
Implemented, but not fully verified because <reason>.
```

Với non-code work, thay build/test evidence bằng review/link/lint/artifact verification phù hợp.

Không claim `done`, `fixed`, hoặc `passing` chỉ từ memory.

---

## Checklist chất lượng handoff

Một handoff đạt yêu cầu khi giai đoạn tiếp theo có thể bắt đầu trong năm phút mà không đọc chat cũ.

Kiểm tra:

- mode và phase rõ ràng,
- các section bắt buộc có mặt,
- approval state và evidence rõ ràng,
- mapping severity/status/verdict nhất quán,
- branch/working tree/evidence identity đã được capture,
- next action cụ thể,
- claims quan trọng có fresh evidence paths,
- raw logs/diffs/files/secrets không bị paste,
- risks/blockers rõ ràng,
- source-of-truth priority được đáp ứng,
- artifact nằm dưới target size,
- read budget rõ ràng,
- `resume.md` trỏ tới handoff này,
- change requests được capture khi requirements thay đổi,
- stale handoff checks pass.

Nếu checklist này fail, hãy fix handoff trước khi vượt phase boundary.

---

## Phân lớp tài liệu khuyến nghị

Để tránh làm mọi operational doc quá dài, hãy chia cách dùng thành các lớp:

1. **Quy tắc vận hành ngắn** — đọc thường xuyên; thuộc về context-budget/workflow docs.
2. **Templates** — đọc khi tạo handoff; thuộc về handoff template docs.
3. **Protocol/reference đầy đủ** — đọc khi thiết kế hoặc debugging workflow; chính là tài liệu này.

Một operational doc ngắn chỉ nên bao gồm:

- artifact-first, không chat-first,
- chọn mode,
- tạo bounded handoff tại phase boundary thực sự,
- chạy structured sanity check,
- không bao giờ paste logs/diffs/secrets,
- final claims cần evidence.

---

## Khuyến nghị skill `phase-handoff` trong tương lai

Skill `phase-handoff` trong tương lai nên nhỏ và deterministic.

Nó chỉ nên làm những việc này:

1. xác định mode, current phase và next phase,
2. chọn đúng phase-specific template,
3. chạy stale/freshness/sanity checks,
4. thu thập state bắt buộc từ artifacts và command summaries đã verify,
5. viết hoặc cập nhật canonical handoff,
6. archive phiên bản canonical trước đó khi cập nhật,
7. cập nhật `resume.md`,
8. xuất prompt ngắn cho next-phase,
9. khuyến nghị `/compact` hoặc fresh session dựa trên context pressure.

Nó không nên:

- implement code,
- chạy broad exploration,
- paste logs,
- paste diffs,
- rewrite toàn bộ plan,
- duplicate mọi artifact vào handoff.

Tên skill được đề xuất:

```text
phase-handoff
```

Tên thay thế:

```text
checkpoint-and-handoff
context-boundary
handoff-before-next-phase
```

---

## Tiêu chí chấp nhận triển khai tổng quát

Giao thức được xem là đã triển khai khi:

- workflow modes đã được định nghĩa và tham chiếu,
- mode selection checklist tồn tại,
- escalation và de-escalation paths tồn tại,
- real phase boundary được định nghĩa,
- model severity/status/verdict tồn tại,
- phase boundaries Standard/Full yêu cầu bounded handoff artifacts,
- paths Tiny/Small tránh ceremony không cần thiết,
- `resume.md` trỏ tới canonical handoff mới nhất,
- handoffs dùng base + phase-specific templates,
- mandatory/optional sections được label,
- handoffs có token targets, line density signals, read budgets và write budgets,
- source-of-truth priority phân biệt requirement changes với process/style instructions,
- approval state yêu cầu approval evidence,
- change requests, mode changes, archive/versioning, garbage collection và concurrency rules tồn tại,
- stale handoff và evidence freshness rules tồn tại,
- claims quan trọng cần fresh evidence paths,
- phases tiếp theo chạy minimum sanity checks với output pass/warn/block,
- raw logs/diffs/secrets được lưu an toàn và không paste vào chat,
- sub-agent prompts có chat-output caps nghiêm ngặt mà không xem chúng là QA coverage caps,
- non-code work có evidence path,
- final claims cần Definition of Done và final verification contract,
- phục hồi API 400 hướng dẫn users bắt đầu fresh từ artifacts,
- tool-specific adaptations được document cục bộ.

---

## Phụ lục tích hợp riêng cho dự án: hero-vibe-kit

Giao thức bên trên mang tính tổng quát. Phần sau áp dụng khi tích hợp nó vào `hero-vibe-kit`.

Thay đổi framework được khuyến nghị:

1. Giữ full protocol làm reference document tại `templates/docs/{en,vi}/PHASE_HANDOFF_PROTOCOL.md` hoặc link tới reference này.
2. **Không** copy full protocol vào `CONTEXT_BUDGET.md` hoặc `AGENCY_WORKFLOW.md`.
3. Chỉ thêm short operational version vào `templates/docs/en/CONTEXT_BUDGET.md` và `templates/docs/vi/CONTEXT_BUDGET.md`.
4. Chỉ thêm phase-boundary và mode-selection rules vào `templates/docs/en/AGENCY_WORKFLOW.md` và `templates/docs/vi/AGENCY_WORKFLOW.md`.
5. Thêm phase-specific handoff prompts vào `templates/docs/en/HANDOFF_TEMPLATES.md` và `templates/docs/vi/HANDOFF_TEMPLATES.md`.
6. Tùy chọn thêm skill `templates/skills/phase-handoff/` đã được curate nếu licensing và attribution rules cho phép.
7. Cập nhật tests để verify bilingual document links và template references.

Kiểm tra bilingual parity nên xác minh:

- mọi link doc EN có link doc VI tương ứng,
- mọi heading thêm vào EN có heading tương ứng trong VI,
- tên handoff template khớp giữa các ngôn ngữ,
- skill references giống nhau giữa docs EN/VI,
- acceptance criteria riêng cho protocol xuất hiện ở cả hai ngôn ngữ.

Vì framework này yêu cầu bilingual parity, mọi thay đổi template-doc dưới `templates/docs/en/` phải được mirror dưới `templates/docs/vi/`.

---

## Ví dụ luồng end-to-end

```text
1. BA hoàn tất discovery.
2. Main Agent viết:
   docs/reports/2026-06-07-checkout-flow/handoffs/01-ba-to-design.md
3. Main Agent cập nhật:
   docs/reports/2026-06-07-checkout-flow/resume.md
4. Main Agent chạy /compact hoặc yêu cầu user bắt đầu một fresh session.
5. Design phase bắt đầu artifact-first từ resume.md và 01-ba-to-design.md.
6. Design hoàn tất và viết 02-design-to-code.md.
7. Code phase bắt đầu từ 02-design-to-code.md sau structured sanity check.
8. Code viết 03-code-to-test.md với changed files và command summaries.
9. Test viết 04-test-to-qa.md với test evidence và gaps.
10. QA sub-agent đọc 04-test-to-qa.md và trả về bounded verdict.
11. Main Agent viết 05-qa-to-handover.md.
12. Main Agent chỉ đưa final claims từ verified evidence trong handover artifact.
```

---

## Quy tắc cuối cùng

```text
Không giai đoạn nào được hand off sang giai đoạn tiếp theo bằng chat history làm context chính.
Mọi phase transition không tầm thường phải dùng artifact có giới hạn và được backed by evidence.
Khi context pressure là medium hoặc high, handoff phải được nối tiếp bằng compact, fresh session, hoặc sub-agent/workflow boundary.
```
