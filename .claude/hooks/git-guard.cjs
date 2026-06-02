#!/usr/bin/env node
'use strict';
/*
 * PreToolUse hook (matcher: Bash) — enforcement "hỗn hợp".
 * CHẶN (exit 2, stderr -> Claude) các lệnh git nguy hiểm.
 * NHẮC (exit 0, stderr -> user) khi commit.
 * Đọc JSON từ stdin theo schema hook của Claude Code: { tool_name, tool_input:{command} }.
 * Tham chiếu quy trình: docs/AGENCY_WORKFLOW.md, docs/BRANCHING.md, docs/DEFINITION_OF_DONE.md
 */
let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }

  if (payload.tool_name !== 'Bash') process.exit(0);
  const cmd = String((payload.tool_input && payload.tool_input.command) || '');
  if (!/\bgit\b/.test(cmd)) process.exit(0);

  const block = (msg) => { console.error('⛔ [git-guard] ' + msg); process.exit(2); };

  const isPush = /\bpush\b/.test(cmd);
  const isCommit = /\bcommit\b/.test(cmd);

  // 1) Force push (cho phép --force-with-lease)
  if (isPush && /(--force(?!-with-lease)|(^|\s)-f(\s|$))/.test(cmd)) {
    block('Chặn force-push (--force/-f). Nếu thực sự cần, dùng --force-with-lease và xác nhận thủ công. ' +
          '`main` được bảo vệ — đẩy thay đổi qua Merge Request (docs/BRANCHING.md).');
  }

  // 2) commit --no-verify / -n  (bỏ qua hook/CI)
  if (isCommit && /(--no-verify|(^|\s)-n(\s|$))/.test(cmd)) {
    block('Chặn `git commit --no-verify`: không bỏ qua hook/kiểm tra trừ khi User yêu cầu rõ ràng.');
  }

  // 3) reset --hard (mất thay đổi)
  if (/\breset\b[\s\S]*--hard/.test(cmd)) {
    block('Chặn `git reset --hard` (có thể mất thay đổi). Cân nhắc `git stash`, hoặc chạy thủ công nếu thực sự muốn.');
  }

  // 4) push thẳng lên main (token "main" độc lập hoặc refspec :main)
  if (isPush && /(^|\s|:)main(\s|$)/.test(cmd) && !/--dry-run/.test(cmd)) {
    block('Chặn push thẳng lên `main` (được bảo vệ). Tạo nhánh + Merge Request (docs/BRANCHING.md).');
  }

  // NHẮC (không chặn) khi commit
  if (isCommit) {
    console.error('🔔 [git-guard] Trước khi commit, kiểm tra: ' +
      '(1) docs/ACTIVE_STATE.md đã cập nhật? ' +
      '(2) đã chạy gitnexus_detect_changes (khi đã có code)? ' +
      '(3) message theo Conventional Commits? — xem docs/DEFINITION_OF_DONE.md');
  }

  process.exit(0);
});
