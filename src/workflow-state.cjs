'use strict';
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join('.hero-vibe-kit', 'session.json');

const VALID_PATH = ['read-only', 'fast', 'standard', 'full', 'timeboxed', null];
const VALID_MODE = ['tiny', 'small', 'standard', 'full', null];
const VALID_PHASE = ['discovery', 'planning', 'implementation', 'review', 'delivery', null];
const VALID_REVIEW_BUDGET = ['none', 'single-combined-review', 'targeted-specialist-review', 'full-multi-stage-review', null];
const VALID_GATE_STATUS = ['not-applicable', 'pending', 'approved', 'blocked'];

function defaultSession() {
  return {
    schemaVersion: 1,
    workItem: null,
    path: null,
    mode: null,
    phase: null,
    reviewBudget: null,
    gates: {
      prd: { required: false, status: 'not-applicable', evidence: null },
      plan: { required: false, status: 'not-applicable', evidence: null },
    },
    reportSlug: null,
    canonicalHandoff: null,
    resumePath: null,
    nextAction: null,
    lastCheckpoint: null,
    loop: {
      retryCount: 0,
      maxRetries: 2,
      lastAction: null,
    },
  };
}

function validateSession(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') { errors.push('session must be an object'); return { ok: false, errors }; }
  if (obj.schemaVersion !== 1) errors.push(`schemaVersion must be 1, got ${obj.schemaVersion}`);
  if (!VALID_PATH.includes(obj.path)) errors.push(`path must be one of ${VALID_PATH.filter(Boolean).join('|')} or null, got "${obj.path}"`);
  if (!VALID_MODE.includes(obj.mode)) errors.push(`mode must be one of ${VALID_MODE.filter(Boolean).join('|')} or null, got "${obj.mode}"`);
  if (!VALID_PHASE.includes(obj.phase)) errors.push(`phase must be one of ${VALID_PHASE.filter(Boolean).join('|')} or null, got "${obj.phase}"`);
  if (!VALID_REVIEW_BUDGET.includes(obj.reviewBudget)) errors.push(`reviewBudget must be one of ${VALID_REVIEW_BUDGET.filter(Boolean).join('|')} or null, got "${obj.reviewBudget}"`);
  if (obj.gates && typeof obj.gates === 'object') {
    for (const key of ['prd', 'plan']) {
      const g = obj.gates[key];
      if (g && !VALID_GATE_STATUS.includes(g.status)) {
        errors.push(`gates.${key}.status must be one of ${VALID_GATE_STATUS.join('|')}, got "${g.status}"`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

function readSession(target) {
  const filePath = path.join(target, SESSION_FILE);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(target, partial) {
  const filePath = path.join(target, SESSION_FILE);
  const existing = readSession(target) || defaultSession();
  const merged = deepMergeSession(existing, partial);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
  return merged;
}

function deepMergeSession(base, partial) {
  const out = Object.assign({}, base);
  for (const [k, v] of Object.entries(partial)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object' && base[k] !== null) {
      out[k] = deepMergeSession(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

module.exports = { defaultSession, validateSession, readSession, writeSession };
