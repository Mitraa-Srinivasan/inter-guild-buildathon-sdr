const { supabase, unwrap } = require('../db/supabase');
const { HttpError } = require('../lib/http');
const { runAgentStep, parseFields, mergeContext, ensureMeeting } = require('./common');

const present = (v) => v !== undefined && v !== null && v !== '';

const LABELS = ['Intent', 'Next Action', 'Reasoning'];
const BOOK_MEETING_RE = /\bbook(?:ing)?\s+(?:a\s+)?(?:meeting|call|demo)\b/i;

// The inbound reply plus basic prospect/campaign context (and our last email, if we drafted one).
function buildConversationPrompt(cp, replyText) {
  const { prospect, campaign } = cp;
  const context = cp.context_json || {};
  const lines = [
    'Inbound reply to classify:',
    replyText.trim(),
    '',
    `Prospect: ${prospect.name}`,
    `Title: ${present(prospect.title) ? prospect.title : 'not provided'}`,
    `Company: ${present(prospect.company) ? prospect.company : 'not provided'}`,
    `Funnel state: ${cp.funnel_state}`,
    `Campaign: ${campaign.name}${present(campaign.description) ? ` - ${campaign.description}` : ''}`,
  ];
  if (present(context.email_subject) && present(context.email_body)) {
    lines.push('', 'Our last outreach email:', `Subject: ${context.email_subject}`, context.email_body);
  }
  return lines.join('\n');
}

// replyText is validated by the caller (non-empty string).
function runConversation(campaignProspectId, replyText) {
  return runAgentStep(campaignProspectId, {
    agentType: 'conversation',
    actionType: 'classify_reply',
    buildPrompt: (cp) => buildConversationPrompt(cp, replyText),
    parse: (raw) => parseFields(raw, LABELS, 'Conversation agent'),
    async apply(cp, f, notes) {
      const intent = f['Intent'];
      const key = intent.toLowerCase();
      const record = {
        reply_text: replyText,
        intent,
        next_action: f['Next Action'],
        reasoning: f['Reasoning'],
        classified_at: new Date().toISOString(),
      };
      const columns = {};

      if (key.startsWith('unsubscribe')) {
        // Done before the row update: if suppression fails the whole step errors and nothing else changes.
        const email = present(cp.prospect.email) ? cp.prospect.email.trim().toLowerCase() : null;
        if (email) {
          unwrap(
            await supabase
              .from('suppression_list')
              .upsert({ value: email, reason: 'unsubscribe (reply)', scope: 'global' }, { onConflict: 'scope,value', ignoreDuplicates: true })
          );
          record.suppressed_email = email;
        } else {
          record.suppression_skipped = 'prospect has no email on file';
        }
      }
      if (key.startsWith('positive')) {
        columns.funnel_state = 'engaged';
        // A positive reply that asks to book a meeting creates a meeting to be scheduled. One pending meeting per
        // campaign prospect: a second positive reply doesn't create a duplicate.
        if (BOOK_MEETING_RE.test(f['Next Action'])) record.meeting_id = await ensureMeeting(cp, notes);
      }

      return mergeContext(cp, { last_conversation: record }, columns);
    },
  });
}

module.exports = { runConversation, buildConversationPrompt };
