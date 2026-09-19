const nodemailer = require('nodemailer');
const { HttpError } = require('./http');

// Real email for the demo, through Gmail SMTP (a Google app password in EMAIL_APP_PASSWORD).
//
// SAFETY: every real send is REDIRECTED. The message is delivered to EMAIL_TEST_RECIPIENT (default: the sending account itself),
// never to the prospect's own address, and says at the top who it was written for. Nothing here can email a prospect. Lifting that
// is deliberately not an env flag: it would be a code change.

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
// -> { messageId, sentTo, intendedFor, response }. Throws HttpError(502) if Gmail refuses or is unreachable.
async function sendRedirectedEmail({ intended, subject, text }) {
  const cfg = mailerConfig();
  if (!cfg.configured) throw new HttpError(503, 'Email is not configured: set EMAIL_USER and EMAIL_APP_PASSWORD in .env');
  const banner = `[Demo redirect] This message was written for ${intended.name || 'a prospect'} <${intended.email}> and delivered to this test inbox instead. It was not sent to them.`;
  let info;
  try {
    info = await transport().sendMail({
      from: `"SDR OS demo" <${cfg.user}>`,
      to: cfg.recipient,
      subject: `[Demo] ${subject}`,
      text: `${banner}\n\n---\n\n${text}`,
      headers: { 'X-SDR-Demo-Redirect': 'true', 'X-SDR-Intended-Recipient': intended.email },
    });
  } catch (err) {
    throw new HttpError(502, `Gmail send failed: ${err.message}`);
  }
  if (info.rejected && info.rejected.length) throw new HttpError(502, `Gmail rejected the recipient(s): ${info.rejected.join(', ')}`);
  return { messageId: info.messageId, sentTo: cfg.recipient, intendedFor: intended.email, response: String(info.response || '').slice(0, 120) };
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
