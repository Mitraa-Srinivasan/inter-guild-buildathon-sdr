const { supabase, unwrap } = require('../db/supabase');
const { preSendGate } = require('./gate');
const { loadCampaignProspect, logActivity } = require('./common');
const { checkConflicts } = require('./conflict');
const { claimDispatchSlot } = require('./dispatchSlot');
const { enabledChannels } = require('./channels');
const { HttpError } = require('../lib/http');
const { mailerConfig, sendRedirectedEmail } = require('../lib/mailer');

// Stages a dispatch moves forward to 'contacted'. Anything else (contacted, engaged, meeting, opportunity,
// and rejected) stays where it is: a dispatch never moves a prospect backwards or un-rejects them.
const ADVANCE_TO_CONTACTED_FROM = ['discovered', 'researched', 'qualified'];

// Outreach dispatch.
//   email + a personalized subject and body already stored on the campaign prospect (from an earlier run-personalize) + Gmail configured
//     -> a REAL email through Gmail, redirected to the test inbox (see lib/mailer.js: it never goes to the prospect's own address)
//   everything else (LinkedIn, SMS, voice/phone, an email with nothing drafted yet, Gmail not configured) -> SIMULATED: nothing is sent,
//     it is only recorded. dispatch never drafts anything itself and never calls a DronaHQ agent.
// Returns one of:
//   { blocked: true, reason }                       kill switch / campaign not live (gate.js) -> 423
//   { denied: true, reason, details }               conflict gate said no; a 'failed' activity was logged -> 409
//   { campaignProspect }                            allowed; a 'success' activity was logged, funnel advanced
// Throws HttpError(502) if a real email send fails (the activity is then 'failed', which never counts toward the caps, and the
// funnel does not move).
async function runDispatch(campaignProspectId, channelInput) {
  const channel = channelInput.trim().toLowerCase();
  const cp = await loadCampaignProspect(campaignProspectId);

  const reason = await preSendGate(cp.campaign);
  if (reason) return { blocked: true, reason };

  const enabled = enabledChannels(cp.campaign.channel_config);
  const verdict = enabled.includes(channel)
    ? await checkConflicts(campaignProspectId, { channel })
    : {
        allowed: false,
        reason: 'channel_not_enabled',
        details: `"${channel}" is not enabled for this campaign (enabled: ${enabled.length ? enabled.join(', ') : 'none'})`,
      };

  const input = `Dispatch requested on channel "${channel}"`;

  // Every deny is recorded. If the log write fails the whole call errors rather than skipping silently.
  if (!verdict.allowed) {
    await logActivity(cp, 'dispatch', 'dispatch', input, `Blocked: ${verdict.reason}${verdict.details ? ` (${verdict.details})` : ''}`, 'failed', channel);
    return { denied: true, reason: verdict.reason, details: verdict.details };
  }

  // Decide up front whether this is a real send, so the claim below can record the right thing. A real send needs the channel to be
  // email, a stored personalized subject + body, an email address for the prospect, and Gmail configured.
  const real = realEmailPlan(cp, channel);

  // Ledger first: the caps are computed from these rows, so they must exist before the state moves (and before anything is sent).
  // The claim re-checks the frequency cap and the daily limit and inserts the 'success' activity as ONE atomic step, so two
  // simultaneous dispatches at the cap boundary can't both get through, and only a dispatch that won a slot ever sends an email
  // (checkConflicts above is only the early, non-atomic pass).
  const claim = await claimDispatchSlot(cp, channel, {
    input: real.send ? `${input}. Subject: "${real.subject}"` : input,
    output: real.send ? 'Claimed a dispatch slot; sending via Gmail...' : `SIMULATED dispatch on ${channel}: no real message was sent${real.note ? ` (${real.note})` : ''}`,
  });
  if (!claim.allowed) {
    await logActivity(cp, 'dispatch', 'dispatch', input, `Blocked: ${claim.reason}${claim.details ? ` (${claim.details})` : ''}`, 'failed', channel);
    return { denied: true, reason: claim.reason, details: claim.details };
  }

  let context = cp.context_json || {};
  if (real.send) {
    try {
      const sent = await sendRedirectedEmail({ intended: { name: cp.prospect.name, email: real.to }, subject: real.subject, text: real.body });
      await supabase.from('activities').update({
        output_summary: `SENT via Gmail SMTP to ${sent.sentTo} (redirected: written for ${sent.intendedFor}, nothing was sent to them). Message id ${sent.messageId}. Server: ${sent.response}${sent.bccCopy === true ? '. A blind copy went to the fixed audit address.' : sent.bccCopy === false ? '. The blind copy to the audit address was refused by Gmail; the email itself was sent.' : ''}`,
      }).eq('id', claim.activity_id);
      context = { ...context, email_sent: { at: new Date().toISOString(), message_id: sent.messageId, sent_to: sent.sentTo, intended_for: sent.intendedFor, subject: real.subject, redirected: true } };
    } catch (err) {
      // The slot was claimed but nothing went out: mark the activity failed so it no longer counts toward any cap.
      await supabase.from('activities').update({ status: 'failed', output_summary: `Email send failed: ${err.message}` }).eq('id', claim.activity_id);
      throw err instanceof HttpError ? err : new HttpError(502, `Email send failed: ${err.message}`);
    }
  }

  const funnelState = ADVANCE_TO_CONTACTED_FROM.includes(cp.funnel_state) ? 'contacted' : cp.funnel_state;
  const updated = unwrap(await supabase.from('campaign_prospects').update({ funnel_state: funnelState, context_json: context }).eq('id', cp.id).select().single());
  return { campaignProspect: updated };
}

// -> { send: true, to, subject, body } for a real email, otherwise { send: false, note } (the note says why it is simulated).
function realEmailPlan(cp, channel) {
  if (channel !== 'email') return { send: false, note: null };
  const c = cp.context_json || {};
  const subject = typeof c.email_subject === 'string' ? c.email_subject.trim() : '';
  const body = typeof c.email_body === 'string' ? c.email_body.trim() : '';
  if (!subject || !body) return { send: false, note: 'no personalized email drafted yet' };
  if (!mailerConfig().configured) return { send: false, note: 'email sending is not configured' };
  const to = typeof cp.prospect.email === 'string' ? cp.prospect.email.trim() : '';
  if (!to) return { send: false, note: 'the prospect has no email address on file' };
  return { send: true, to, subject, body };
}

module.exports = { runDispatch };
