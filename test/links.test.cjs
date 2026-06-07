'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { checkLinks } = require('../src/links.cjs');

function relativeFiles(root) {
  const out = [];
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(path.relative(root, p).split(path.sep).join('/'));
    }
  }
  walk(root);
  return out.sort();
}

for (const lang of ['en', 'vi']) {
  test(`doc links resolve (${lang})`, () => {
    const dir = path.join(__dirname, '..', 'templates', 'docs', lang);
    const { broken, checked } = checkLinks([dir]);
    assert.ok(checked > 0, 'should check some links');
    assert.deepStrictEqual(broken, [], 'no broken links: ' + JSON.stringify(broken));
  });
}

test('template docs language trees have identical relative file sets', () => {
  const docsRoot = path.join(__dirname, '..', 'templates', 'docs');
  assert.deepStrictEqual(relativeFiles(path.join(docsRoot, 'vi')), relativeFiles(path.join(docsRoot, 'en')));
});

test('phase handoff protocol is wired into bilingual workflow docs', () => {
  const docsRoot = path.join(__dirname, '..', 'templates', 'docs');
  const requiredDocs = ['PHASE_HANDOFF_PROTOCOL.md', 'AGENCY_WORKFLOW.md', 'CONTEXT_BUDGET.md', 'HANDOFF_TEMPLATES.md'];
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assertContains = (text, expected, message) => {
    assert.match(text, new RegExp(escapeRegExp(expected)), message || `missing: ${expected}`);
  };

  for (const lang of ['en', 'vi']) {
    for (const doc of requiredDocs) {
      assert.ok(fs.existsSync(path.join(docsRoot, lang, doc)), `missing ${lang}/${doc}`);
    }
  }

  const enWorkflow = fs.readFileSync(path.join(docsRoot, 'en', 'AGENCY_WORKFLOW.md'), 'utf8');
  const viWorkflow = fs.readFileSync(path.join(docsRoot, 'vi', 'AGENCY_WORKFLOW.md'), 'utf8');
  assertContains(enWorkflow, 'PHASE_HANDOFF_PROTOCOL.md', 'EN workflow should reference phase handoff protocol');
  assertContains(viWorkflow, 'PHASE_HANDOFF_PROTOCOL.md', 'VI workflow should reference phase handoff protocol');
  assert.match(enWorkflow, /Tiny[\s\S]*Small[\s\S]*Standard[\s\S]*Full/, 'EN workflow should list context tiers');
  assert.match(viWorkflow, /Tiny[\s\S]*Small[\s\S]*Standard[\s\S]*Full/, 'VI workflow should list context tiers');

  const enContextBudget = fs.readFileSync(path.join(docsRoot, 'en', 'CONTEXT_BUDGET.md'), 'utf8');
  for (const expected of ['artifact-first', 'resume.md', 'Sanity check', 'Evidence freshness', 'Final claims']) {
    assertContains(enContextBudget, expected, `EN context budget should contain ${expected}`);
  }

  const viContextBudget = fs.readFileSync(path.join(docsRoot, 'vi', 'CONTEXT_BUDGET.md'), 'utf8');
  for (const expected of ['artifact-first', 'resume.md', 'Sanity check', 'Evidence freshness', 'claim cuối']) {
    assertContains(viContextBudget, expected, `VI context budget should contain ${expected}`);
  }

  const enHandoffTemplates = fs.readFileSync(path.join(docsRoot, 'en', 'HANDOFF_TEMPLATES.md'), 'utf8');
  for (const expected of ['Code → Test', 'Test → Verify / QA', 'QA sub-agent prompt', 'Short next-phase prompt']) {
    assertContains(enHandoffTemplates, expected, `EN handoff templates should contain ${expected}`);
  }

  const viHandoffTemplates = fs.readFileSync(path.join(docsRoot, 'vi', 'HANDOFF_TEMPLATES.md'), 'utf8');
  for (const expected of ['Code → Test', 'Test → Verify / QA', 'Prompt QA sub-agent', 'Prompt ngắn cho phase tiếp theo']) {
    assertContains(viHandoffTemplates, expected, `VI handoff templates should contain ${expected}`);
  }
});
