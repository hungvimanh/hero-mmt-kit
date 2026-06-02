#!/usr/bin/env node
'use strict';
/*
 * Stop hook — nhắc mềm (non-blocking, exit 0).
 * Nếu có thay đổi chưa commit mà docs/ACTIVE_STATE.md chưa được động tới,
 * in nhắc nhở (hiển thị cho user). KHÔNG chặn việc dừng (không exit 2 -> tránh vòng lặp).
 */
const { execSync } = require('child_process');

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(raw || '{}'); } catch (_) { /* ignore */ }
  if (payload.stop_hook_active) process.exit(0); // tránh kích hoạt lặp

  const cwd = payload.cwd || process.cwd();
  let status = '';
  try {
    status = execSync('git status --porcelain', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_) { process.exit(0); }

  const lines = status.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) process.exit(0); // không có gì thay đổi

  const stateTouched = lines.some((l) => /ACTIVE_STATE\.md$/.test(l));
  const otherChanged = lines.some((l) => !/ACTIVE_STATE\.md$/.test(l));

  if (otherChanged && !stateTouched) {
    console.error('🔔 [stop-reminder] Có thay đổi chưa commit nhưng docs/ACTIVE_STATE.md chưa được cập nhật. ' +
      'Nếu trạng thái công việc đã đổi, hãy cập nhật bảng pipeline + resume protocol (docs/AGENCY_WORKFLOW.md §0).');
  }
  process.exit(0);
});
