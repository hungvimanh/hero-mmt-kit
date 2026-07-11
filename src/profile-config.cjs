'use strict';

function normalizeProfileConfig(input, flags) {
  input = input || {};
  flags = flags || {};
  const installTasteSkill = Object.prototype.hasOwnProperty.call(flags, 'taste')
    ? !!flags.taste
    : !!input.installTasteSkill;
  return Object.assign({}, input, { installTasteSkill });
}

async function collectProfileConfig(input, flags, ask) {
  input = input || {};
  flags = flags || {};

  if (!Object.prototype.hasOwnProperty.call(flags, 'taste') && typeof input.installTasteSkill !== 'boolean') {
    input = Object.assign({}, input, {
      installTasteSkill: await ask.yesno('Install the taste/design skill?', false),
    });
  }

  return normalizeProfileConfig(input, flags);
}

module.exports = {
  normalizeProfileConfig,
  collectProfileConfig,
};
