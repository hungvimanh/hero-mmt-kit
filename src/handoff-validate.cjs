'use strict';

const VALID_MODE = ['tiny', 'small', 'standard', 'full'];
const VALID_PHASE = ['discovery', 'planning', 'implementation', 'review', 'delivery'];
const VALID_STATUS = ['green', 'yellow', 'red'];
const VALID_APPROVAL = ['draft', 'approved', 'auto-approved', 'blocked'];
const REQUIRED_FM_KEYS = ['hvkHandoffVersion', 'workItem', 'mode', 'fromPhase', 'toPhase', 'status', 'approval', 'reportSlug'];

// Minimum body section requirements per mode
const REQUIRED_SECTIONS = {
  tiny: ['Next action'],
  small: ['Next action'],
  standard: ['Source of truth', 'Read first', 'Next action'],
  full: ['Source of truth', 'Read first', 'Do not read', 'Next action'],
};

function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return { fm: null, body: text };
  const end = lines.indexOf('---', 1);
  if (end === -1) return { fm: null, body: text };
  const fmLines = lines.slice(1, end);
  const body = lines.slice(end + 1).join('\n');
  const fm = {};
  for (const line of fmLines) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    fm[key] = val;
  }
  return { fm, body };
}

function validateFrontmatter(fm) {
  const errors = [];
  const warnings = [];
  for (const key of REQUIRED_FM_KEYS) {
    if (!fm[key]) errors.push(`frontmatter missing required key: ${key}`);
  }
  if (fm.mode && !VALID_MODE.includes(fm.mode)) errors.push(`frontmatter mode must be one of ${VALID_MODE.join('|')}, got "${fm.mode}"`);
  if (fm.fromPhase && !VALID_PHASE.includes(fm.fromPhase)) errors.push(`frontmatter fromPhase invalid: "${fm.fromPhase}"`);
  if (fm.toPhase && !VALID_PHASE.includes(fm.toPhase)) errors.push(`frontmatter toPhase invalid: "${fm.toPhase}"`);
  if (fm.status && !VALID_STATUS.includes(fm.status)) errors.push(`frontmatter status must be one of ${VALID_STATUS.join('|')}, got "${fm.status}"`);
  if (fm.approval && !VALID_APPROVAL.includes(fm.approval)) errors.push(`frontmatter approval must be one of ${VALID_APPROVAL.join('|')}, got "${fm.approval}"`);
  if (fm.hvkHandoffVersion && fm.hvkHandoffVersion !== '1') warnings.push(`hvkHandoffVersion "${fm.hvkHandoffVersion}" unrecognized — expected 1`);
  return { errors, warnings };
}

function validateBody(body, mode) {
  const requiredSections = REQUIRED_SECTIONS[mode] || REQUIRED_SECTIONS.standard;
  const warnings = [];
  for (const section of requiredSections) {
    const pattern = new RegExp(`##\\s+${section}`, 'i');
    if (!pattern.test(body)) warnings.push(`body missing expected section: "## ${section}"`);
  }
  return warnings;
}

function validate(text, filePath) {
  const errors = [];
  const warnings = [];

  if (!text || text.trim() === '') {
    errors.push('handoff file is empty');
    return { ok: false, warnings, errors };
  }

  const { fm, body } = parseFrontmatter(text);

  if (!fm) {
    // Legacy handoff: no frontmatter — warn only, not an error
    warnings.push('no YAML frontmatter found — add hvkHandoffVersion block for machine validation');
    // Still check for basic sections using 'standard' as default
    const bodyWarnings = validateBody(text, 'standard');
    warnings.push(...bodyWarnings);
    return { ok: true, warnings, errors };
  }

  const fmResult = validateFrontmatter(fm);
  errors.push(...fmResult.errors);
  warnings.push(...fmResult.warnings);

  if (fmResult.errors.length === 0 && fm.mode) {
    const bodyWarnings = validateBody(body, fm.mode);
    warnings.push(...bodyWarnings);
  }

  return { ok: errors.length === 0, warnings, errors };
}

module.exports = { validate, parseFrontmatter };
