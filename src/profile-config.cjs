'use strict';

const PROFILES = ['vibecode', 'coding-assistant'];
const SURFACES = ['fullstack', 'backend', 'frontend'];
const VERIFY_LEVELS = ['strict', 'pragmatic', 'minimal'];

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

function validate(name, value, expected) {
  if (!expected.includes(value)) invalidFlag(name, value, expected);
  return value;
}

function normalizeProfileConfig(input, flags) {
  input = input || {};
  flags = flags || {};

  const hasProfileFlag = Object.prototype.hasOwnProperty.call(flags, 'profile');
  const hasSurfaceFlag = Object.prototype.hasOwnProperty.call(flags, 'surface');
  const hasVerifyFlag = Object.prototype.hasOwnProperty.call(flags, 'verify');

  const assistanceProfile = validate(
    'profile',
    hasProfileFlag ? flags.profile : (input.assistanceProfile || DEFAULTS.assistanceProfile),
    PROFILES
  );
  const projectSurface = validate(
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

  return Object.assign({}, input, {
    assistanceProfile,
    projectSurface,
    verificationLevel,
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
  if (!Object.prototype.hasOwnProperty.call(promptFlags, 'surface') && !collected.projectSurface) {
    collected.projectSurface = auto
      ? DEFAULTS.projectSurface
      : await ask.choice('Project surface:', SURFACES, SURFACES.indexOf(DEFAULTS.projectSurface));
  }

  return normalizeProfileConfig(collected, promptFlags);
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
  DEFAULTS,
  PROFILE_LABELS,
  SURFACE_LABELS,
  defaultVerification,
  normalizeProfileConfig,
  collectProfileConfig,
  buildProfileVars,
};
