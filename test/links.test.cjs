'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { checkLinks } = require('../src/links.cjs');

test('template doc links resolve', () => {
  const dir = path.join(__dirname, '..', 'templates', 'docs');
  const { broken, checked } = checkLinks([dir]);
  assert.ok(checked > 0, 'should check some links');
  assert.deepStrictEqual(broken, [], 'no broken links: ' + JSON.stringify(broken));
});

test('phase handoff protocol is wired into workflow docs', () => {
  const docsRoot = path.join(__dirname, '..', 'templates', 'docs');
  const requiredDocs = ['PHASE_HANDOFF_PROTOCOL.md', 'AGENCY_WORKFLOW.md', 'CONTEXT_BUDGET.md', 'HANDOFF_TEMPLATES.md', 'ASSISTANCE_PROFILES.md'];
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assertContains = (text, expected, message) => {
    assert.match(text, new RegExp(escapeRegExp(expected)), message || `missing: ${expected}`);
  };

  for (const doc of requiredDocs) {
    assert.ok(fs.existsSync(path.join(docsRoot, doc)), `missing ${doc}`);
  }

  const workflow = fs.readFileSync(path.join(docsRoot, 'AGENCY_WORKFLOW.md'), 'utf8');
  assertContains(workflow, 'PHASE_HANDOFF_PROTOCOL.md', 'workflow should reference phase handoff protocol');
  assertContains(workflow, 'ASSISTANCE_PROFILES.md', 'workflow should reference assistance profiles');
  assert.match(workflow, /Tiny[\s\S]*Small[\s\S]*Standard[\s\S]*Full/, 'workflow should list context tiers');

  const contextBudget = fs.readFileSync(path.join(docsRoot, 'CONTEXT_BUDGET.md'), 'utf8');
  for (const expected of ['artifact-first', 'resume.md', 'Sanity check', 'Evidence freshness', 'Final claims']) {
    assertContains(contextBudget, expected, `context budget should contain ${expected}`);
  }

  const handoffTemplates = fs.readFileSync(path.join(docsRoot, 'HANDOFF_TEMPLATES.md'), 'utf8');
  for (const expected of ['Code → Test', 'Test → Verify / QA', 'QA sub-agent prompt', 'Short next-phase prompt']) {
    assertContains(handoffTemplates, expected, `handoff templates should contain ${expected}`);
  }
});
