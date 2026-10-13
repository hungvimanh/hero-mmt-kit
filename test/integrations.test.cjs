'use strict';
const test = require('node:test');
const assert = require('node:assert');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { installableSources, run, wantsDesignIntegration } = require('../src/integrations.cjs');

test('wantsDesignIntegration reflects the taste skill opt-in', () => {
  assert.strictEqual(wantsDesignIntegration({ installTasteSkill: true }), true);
  assert.strictEqual(wantsDesignIntegration({ installTasteSkill: false }), false);
});

test('wantsDesignIntegration defaults to false when unset', () => {
  assert.strictEqual(wantsDesignIntegration({}), false);
  assert.strictEqual(wantsDesignIntegration(null), false);
});

test('installableSources filters TBD sources and deduplicates install sources', () => {
  assert.deepStrictEqual(installableSources({ skills: [
    { source: 'Leonxlnx/taste-skill' },
    { source: '<TBD>' },
    { source: 'Leonxlnx/taste-skill' },
    { source: '' },
  ] }), ['Leonxlnx/taste-skill']);
});

test('Serena workflow memo includes Go coding without installing external tools', async (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hvk-go-memo-'));
  t.after(() => fs.rmSync(target, { recursive: true, force: true }));
  const cfg = { installTasteSkill: false };
  await run({
    target,
    cfg,
    detect: { hasSerena: true, hasGitnexus: false },
    pkgRoot: path.join(__dirname, '..'),
  });

  const memo = fs.readFileSync(path.join(target, '.serena', 'memories', 'project', 'hero_workflow.md'), 'utf8');
  assert.match(memo, /hero-golang \(Go specialization of the same hero-coding stage/i);
  assert.match(memo, /ownership, cancellation, and bounded formatting/i);
  assert.match(memo, /always read the source files/i);
  assert.deepStrictEqual(cfg.integrations, {
    skills: 'bundled', design: 'skipped', gitnexus: 'skipped', serena: 'seeded',
  });
});
