const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { HttpError } = require('./http');

// Real email for the demo, through Gmail SMTP (a Google app password in EMAIL_APP_PASSWORD).
//
// SAFETY: every real send is REDIRECTED. The message is delivered to EMAIL_TEST_RECIPIENT (default: the sending account itself),
// never to the prospect's own address, and says at the top who it was written for. Nothing here can email a prospect. Lifting that
// is deliberately not an env flag: it would be a code change.

// Every real email is ALSO blind-copied to one audit address, always: not per campaign, not per request. The address lives in the
// environment, not in code, and is kept out of the database, the activity log and every agent prompt (activity text and context_json
// are fed to the agents).
//
// How: the identical message (same Message-ID and Date, headers naming only the To recipient) is sent a second time in its own SMTP
// transaction whose ENVELOPE recipient is this address, right after the normal send. A Bcc header (or an extra envelope recipient in
// the same transaction) is not used on purpose: nodemailer's SMTP transport already omits the header, but Gmail then writes a
// "Bcc: <address>" line into the SENDER's stored copy, and here the sender's mailbox is also the visible recipient's (every send is
// redirected to it), so the address would show in the headers of the message in the test inbox. Sent as its own transaction, no copy in
// that mailbox carries it (verified against Gmail).
// The address comes from the AUDIT_BCC_EMAIL environment variable (never from code, a campaign or a request). Unset = no blind copy.
const auditBcc = () => String(process.env.AUDIT_BCC_EMAIL || '').trim().toLowerCase() || null;

const SEND_TIMEOUTS = { connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 };
const VERIFY_CACHE_MS = 10 * 60 * 1000;

let transportOverride = null; // tests only
let cachedTransport = null;
let verifyCache = null;

function mailerConfig() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  return { configured: Boolean(user && pass), user: user || null, recipient: process.env.EMAIL_TEST_RECIPIENT || user || null };
}

function transport() {
  if (transportOverride) return transportOverride;
  const { user } = mailerConfig();
  const key = `${user}|${process.env.EMAIL_APP_PASSWORD}`;
  if (!cachedTransport || cachedTransport.key !== key) {
    cachedTransport = { key, t: nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass: process.env.EMAIL_APP_PASSWORD }, ...SEND_TIMEOUTS }) };
  }
  return cachedTransport.t;
}

// Sends one email, redirected to the test inbox. `intended` is who it was written for: { name, email }.
// -> { messageId, sentTo, intendedFor, response, bccCopy }. Throws HttpError(502) if Gmail refuses or is unreachable, or refuses the
// To recipient (and then no blind copy is sent). bccCopy: true = the blind copy was accepted, false = it failed or was refused after the
// email itself had gone out (which is therefore still a successful send), null = not applicable.
async function sendRedirectedEmail({ intended, subject, text }) {
  const cfg = mailerConfig();
  if (!cfg.configured) throw new HttpError(503, 'Email is not configured: set EMAIL_USER and EMAIL_APP_PASSWORD in .env');
  const banner = `[Demo redirect] This message was written for ${intended.name || 'a prospect'} <${intended.email}> and delivered to this test inbox instead. It was not sent to them.`;
  const message = {
    from: `"SDR OS demo" <${cfg.user}>`,
    to: cfg.recipient,
    subject: `[Demo] ${subject}`,
    text: `${banner}\n\n---\n\n${text}`,
    headers: { 'X-SDR-Demo-Redirect': 'true', 'X-SDR-Intended-Recipient': intended.email },
    // fixed up front so the blind copy below is the very same message, not a lookalike
    messageId: `<${crypto.randomUUID()}@${cfg.user.split('@')[1] || 'localhost'}>`,
    date: new Date(),
  };
  let info;
  try {
    info = await transport().sendMail(message);
  } catch (err) {
    throw new HttpError(502, `Gmail send failed: ${err.message}`);
  }
  if (info.rejected && info.rejected.length) throw new HttpError(502, `Gmail rejected the recipient(s): ${info.rejected.join(', ')}`);

  // The blind copy. The email above has already gone out, so nothing that goes wrong here may make this call fail (that would mark the
  // activity failed, which no cap counts, and invite a duplicate send): it is reported through bccCopy instead.
  const audit = auditBcc();
  const bcc = !audit || cfg.recipient.toLowerCase() === audit ? null : audit; // not configured, or already the visible recipient: nothing to add
  let bccCopy = null;
  if (bcc) {
    try {
      const b = await transport().sendMail({ ...message, envelope: { from: cfg.user, to: [bcc] } });
      bccCopy = !(b.rejected && b.rejected.length) && Boolean(b.accepted && b.accepted.length);
    } catch (err) {
      console.error('Audit blind copy failed (the email itself was sent):', err.message);
      bccCopy = false;
    }
  }
  return { messageId: info.messageId, sentTo: cfg.recipient, intendedFor: intended.email, response: String(info.response || '').slice(0, 120), bccCopy };
}

// Is the Gmail login accepted? An SMTP handshake and login only: sends nothing. Cached for 10 minutes so the sidebar's health
// polling never hammers Gmail. -> { configured, verified: true|false|null, detail }
async function gmailStatus() {
  const cfg = mailerConfig();
  if (!cfg.configured) return { configured: false, verified: null, detail: 'EMAIL_USER / EMAIL_APP_PASSWORD not set' };
  if (verifyCache && verifyCache.key === `${cfg.user}|${process.env.EMAIL_APP_PASSWORD}` && Date.now() - verifyCache.at < VERIFY_CACHE_MS) return verifyCache.value;
  let value;
  try {
    await transport().verify();
    value = { configured: true, verified: true, detail: `signed in as ${cfg.user}; sends are redirected to ${cfg.recipient}` };
  } catch (err) {
    value = { configured: true, verified: false, detail: `login failed: ${err.message}` };
  }
  verifyCache = { key: `${cfg.user}|${process.env.EMAIL_APP_PASSWORD}`, at: Date.now(), value };
  return value;
}

module.exports = {
  mailerConfig, sendRedirectedEmail, gmailStatus,
  _setTransportForTests: (t) => { transportOverride = t; verifyCache = null; },
};
