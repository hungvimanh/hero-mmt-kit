'use strict';
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join('.hero-mmt-kit', 'session.json');

function defaultSession() {
  return {
    schemaVersion: 1,
    currentSkill: null,
    lastCheckpoint: null,
    resumePath: null,
    nextAction: null,
    updatedAt: null,
  };
}

const STRING_OR_NULL_FIELDS = ['currentSkill', 'lastCheckpoint', 'resumePath', 'nextAction', 'updatedAt'];

function validateSession(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') { errors.push('session must be an object'); return { ok: false, errors }; }
  if (obj.schemaVersion !== 1) errors.push(`schemaVersion must be 1, got ${obj.schemaVersion}`);
  for (const key of STRING_OR_NULL_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && typeof obj[key] !== 'string') {
      errors.push(`${key} must be a string or null, got "${obj[key]}"`);
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
