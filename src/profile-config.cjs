'use strict';

const PROFILES = ['vibecode', 'coding-assistant'];
const SURFACES = ['fullstack', 'backend', 'frontend'];
const VERIFY_LEVELS = ['strict', 'pragmatic', 'minimal'];
const IDE_TARGETS = ['claude-code', 'cursor'];
const IDE_CHOICES = ['claude-code', 'cursor', 'both'];

const DEFAULTS = {
  assistanceProfile: 'coding-assistant',
  projectSurface: 'fullstack',
};

const PROFILE_LABELS = {
  vibecode: 'Vibecode',
  'coding-assistant': 'Coding Assistant',
};

const SURFACE_LABELS = {
  fullstack: 'Fullstack',
  backend: 'Backend',
  frontend: 'Frontend',
};

function defaultVerification(profile) {
  return profile === 'vibecode' ? 'strict' : 'pragmatic';
}

function invalidFlag(name, value, expected) {
  throw new Error(`Invalid --${name}: ${value}. Expected one of: ${expected.join(', ')}.`);
}

function invalidIdeTargets(value) {
  throw new Error(`Invalid --ide: ${value}. Expected one of: claude-code, cursor, both.`);
}

function normalizeIdeTargets(value) {
  if (value === 'both') return IDE_TARGETS.slice();
  if (IDE_TARGETS.includes(value)) return [value];
  invalidIdeTargets(value);
}

function resolveIdeTargets(input, flags, opts) {
  input = input || {};
  flags = flags || {};
  opts = opts || {};
  if (Object.prototype.hasOwnProperty.call(flags, 'ide')) return normalizeIdeTargets(flags.ide);
  if (Array.isArray(input.ideTargets) && input.ideTargets.length) {
    const out = [];
    for (const item of input.ideTargets) {
      if (!IDE_TARGETS.includes(item)) invalidIdeTargets(item);
      if (!out.includes(item)) out.push(item);
    }
    if (out.length) return out;
  }
  if (opts.requireExplicit) return null;
  return ['claude-code'];
}

function skillDestinations(ideTargets) {
  const dests = [];
  if (ideTargets.includes('claude-code')) dests.push('.claude/skills');
  if (ideTargets.includes('cursor')) dests.push('.cursor/skills');
  return dests;
}

function validate(name, value, expected) {
  if (!expected.includes(value)) invalidFlag(name, value, expected);
  return value;
}

function normalizeProfileConfig(input, flags, opts) {
  input = input || {};
  flags = flags || {};
  opts = opts || {};

  const hasProfileFlag = Object.prototype.hasOwnProperty.call(flags, 'profile');
  const hasSurfaceFlag = Object.prototype.hasOwnProperty.call(flags, 'surface');
  const hasVerifyFlag = Object.prototype.hasOwnProperty.call(flags, 'verify');

  const assistanceProfile = validate(
    'profile',
    hasProfileFlag ? flags.profile : (input.assistanceProfile || DEFAULTS.assistanceProfile),
    PROFILES
  );
  const projectSurface = assistanceProfile === 'vibecode'
    ? DEFAULTS.projectSurface
    : validate(
      'surface',
      hasSurfaceFlag ? flags.surface : (input.projectSurface || DEFAULTS.projectSurface),
      SURFACES
    );

  let verificationLevel;
  if (hasVerifyFlag) {
    verificationLevel = flags.verify;
  } else if (hasProfileFlag) {
    verificationLevel = defaultVerification(assistanceProfile);
  } else {
    verificationLevel = input.verificationLevel || defaultVerification(assistanceProfile);
  }
  verificationLevel = validate('verify', verificationLevel, VERIFY_LEVELS);

  const ideTargets = resolveIdeTargets(input, flags, { requireExplicit: opts.requireExplicitIde });
  if (!ideTargets) {
    throw new Error('IDE target is required. Use --ide claude-code | cursor | both, or run init interactively.');
  }

  return Object.assign({}, input, {
    assistanceProfile,
    projectSurface,
    verificationLevel,
    ideTargets,
  });
}

async function collectProfileConfig(input, flags, ask, auto) {
  input = input || {};
  flags = flags || {};

  const collected = Object.assign({}, input);
  const promptFlags = Object.assign({}, flags);

  if (!Object.prototype.hasOwnProperty.call(promptFlags, 'profile') && !collected.assistanceProfile) {
    collected.assistanceProfile = auto
      ? DEFAULTS.assistanceProfile
      : await ask.choice('Assistance profile:', PROFILES, PROFILES.indexOf(DEFAULTS.assistanceProfile));
  }
  if (collected.assistanceProfile === 'vibecode' || promptFlags.profile === 'vibecode') {
    collected.projectSurface = DEFAULTS.projectSurface;
    delete promptFlags.surface;
  } else if (!Object.prototype.hasOwnProperty.call(promptFlags, 'surface') && !collected.projectSurface) {
    collected.projectSurface = auto
      ? DEFAULTS.projectSurface
      : await ask.choice('Project surface:', SURFACES, SURFACES.indexOf(DEFAULTS.projectSurface));
  }
  if (!Object.prototype.hasOwnProperty.call(promptFlags, 'ide') && !collected.ideTargets) {
    if (auto) {
      throw new Error('Non-interactive init requires --ide (claude-code | cursor | both).');
    }
    promptFlags.ide = await ask.choice('IDE target:', IDE_CHOICES, 0);
  }

  return normalizeProfileConfig(collected, promptFlags, { requireExplicitIde: false });
}

function buildProfileVars(cfg) {
  return {
    ASSISTANCE_PROFILE: cfg.assistanceProfile,
    ASSISTANCE_PROFILE_LABEL: PROFILE_LABELS[cfg.assistanceProfile] || cfg.assistanceProfile,
    PROJECT_SURFACE: cfg.projectSurface,
    PROJECT_SURFACE_LABEL: SURFACE_LABELS[cfg.projectSurface] || cfg.projectSurface,
    VERIFICATION_LEVEL: cfg.verificationLevel,
  };
}

module.exports = {
  PROFILES,
  SURFACES,
  VERIFY_LEVELS,
  IDE_TARGETS,
  IDE_CHOICES,
  DEFAULTS,
  PROFILE_LABELS,
  SURFACE_LABELS,
  defaultVerification,
  normalizeProfileConfig,
  collectProfileConfig,
  buildProfileVars,
  resolveIdeTargets,
  skillDestinations,
};
