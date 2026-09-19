const { supabase } = require('../db/supabase');
const { HttpError } = require('../lib/http');

// Values an agent may use to say "no channel right now" (e.g. Contact Now: no). Never executable, so always safe.
const NO_CHANNEL = new Set(['none', 'n/a', 'na', 'null', '-', 'no channel']);

const normalize = (s) => String(s).toLowerCase().replace(/[*_`"']/g, '').trim();

// Channels switched on in campaigns.channel_config, e.g. { email: { enabled: true }, phone: { enabled: false } }.
// A channel counts only if it is explicitly enabled.
function enabledChannels(channelConfig) {
  return Object.entries(channelConfig || {})
    .filter(([, v]) => v === true || (v && typeof v === 'object' && v.enabled === true))
    .map(([k]) => normalize(k));
}

// One prompt line for the agents, e.g. "Available channels for this campaign: email, linkedin".
function availableChannelsLine(channels) {
  return `Available channels for this campaign: ${channels.length ? channels.join(', ') : 'none configured'}`;
}

// Safety net: an agent's recommended channel must be enabled for the campaign, otherwise 422.
// Callers run this inside the step's parse phase, so a violation is logged as a failed activity and nothing is stored.
function assertChannelAllowed(value, channels, agentName) {
  const ch = normalize(value);
  if (NO_CHANNEL.has(ch) || channels.includes(ch)) return;
  throw new HttpError(
    422,
    `Channel mismatch: ${agentName} recommended "${value}", which is not enabled for this campaign (enabled: ${channels.length ? channels.join(', ') : 'none'})`
  );
}

// Channels paused for the whole platform (global_settings.channels, e.g. { email: { enabled: false } }), as a Set of
// lowercase names. A missing column (schema not yet updated) means nothing is paused rather than every dispatch failing.
async function globallyPausedChannels() {
  const { data, error } = await supabase.from('global_settings').select('channels').eq('id', true).maybeSingle();
  if (error) {
    if (error.code === '42703') return new Set();
    throw error;
  }
  return pausedFrom(data && data.channels);
}

function pausedFrom(channels) {
  return new Set(
    Object.entries(channels || {})
      .filter(([, v]) => v === false || (v && typeof v === 'object' && v.enabled === false))
      .map(([k]) => normalize(k))
  );
}

// 'phone' is the same channel as 'voice' for global pauses.
const globalChannelName = (channel) => (normalize(channel) === 'phone' ? 'voice' : normalize(channel));

module.exports = { enabledChannels, availableChannelsLine, assertChannelAllowed, globallyPausedChannels, globalChannelName };
