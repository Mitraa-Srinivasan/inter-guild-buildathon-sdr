// Creates (or updates) the team's login accounts in Supabase Auth and, once db/schema.sql has been run, their `profiles` rows.
//
//   node db/seed-users.js            create missing accounts with random passwords (printed ONCE, never stored), and refresh
//                                    every member's name / role; existing passwords are left alone
//   node db/seed-users.js --reset    also give every existing account a NEW random password
//
// Who is on the team lives in db/team.json (git-ignored, so real email addresses stay out of the repo). Copy db/team.example.json:
//   [{ "email": "you@company.com", "display_name": "Your Name", "role": "Sales Manager" }, ...]
// To choose a password yourself set SEED_PASSWORD_<KEY> (KEY = optional "key" field, else the first word of display_name, upper case).
//
// Accounts are created already confirmed (no email is sent). Team membership is recorded in two places the browser can't edit:
// app_metadata.role (works right away) and the profiles table (authoritative once db/schema.sql has created it).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { supabase } = require('./supabase');

const TEAM_FILE = path.join(__dirname, 'team.json');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // no look-alikes (0/O, 1/l/I)
const randomPassword = (n = 20) => Array.from({ length: n }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
const reset = process.argv.includes('--reset');

function loadTeam() {
  if (!fs.existsSync(TEAM_FILE)) {
    console.error('db/team.json not found. Copy db/team.example.json to db/team.json and put your team in it.');
    process.exit(1);
  }
  const team = JSON.parse(fs.readFileSync(TEAM_FILE, 'utf8'));
  if (!Array.isArray(team) || !team.length) throw new Error('db/team.json must be a non-empty array');
  for (const m of team) {
    if (!m.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) throw new Error(`bad email in db/team.json: ${m.email}`);
    if (!m.display_name) throw new Error(`display_name missing for ${m.email}`);
    m.role = m.role || 'Sales Manager';
    m.email = m.email.trim().toLowerCase();
  }
  return team;
}

async function findUserByEmail(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
}

(async () => {
  const team = loadTeam();
  const rows = [];
  let profilesMissing = false;

  for (const m of team) {
    const key = (m.key || m.display_name.split(/\s+/)[0]).toUpperCase();
    const fixed = process.env[`SEED_PASSWORD_${key}`];
    let user = await findUserByEmail(m.email);
    let password = null;
    let action;

    if (!user) {
      password = fixed || randomPassword();
      const { data, error } = await supabase.auth.admin.createUser({
        email: m.email, password, email_confirm: true,
        app_metadata: { role: m.role, display_name: m.display_name },
        user_metadata: { display_name: m.display_name },
      });
      if (error) throw new Error(`could not create ${m.email}: ${error.message}`);
      user = data.user;
      action = 'created';
    } else {
      const patch = { app_metadata: { ...(user.app_metadata || {}), role: m.role, display_name: m.display_name }, user_metadata: { ...(user.user_metadata || {}), display_name: m.display_name } };
      if (reset || fixed) { password = fixed || randomPassword(); patch.password = password; }
      const { error } = await supabase.auth.admin.updateUserById(user.id, patch);
      if (error) throw new Error(`could not update ${m.email}: ${error.message}`);
      action = password ? 'password reset' : 'updated';
    }

    const { error: pErr } = await supabase.from('profiles').upsert({ id: user.id, display_name: m.display_name, role: m.role });
    let profile = 'saved';
    if (pErr) {
      if (pErr.code === 'PGRST205' || pErr.code === '42P01') { profile = 'table missing'; profilesMissing = true; }
      else throw new Error(`profiles upsert failed for ${m.email}: ${pErr.message}`);
    }
    rows.push({ name: m.display_name, role: m.role, email: m.email, action, profile, password });
  }

  console.log('\nTeam accounts');
  console.log('-------------');
  for (const r of rows) {
    console.log(`${r.name} (${r.role})  [${r.action}; profiles row: ${r.profile}]`);
    console.log(`  email:    ${r.email}`);
    console.log(`  password: ${r.password || '(unchanged)'}`);
  }
  if (rows.some((r) => r.password)) console.log('\nThese passwords are shown once and stored nowhere. Sign in, then share them over a private channel and change them.');
  if (profilesMissing) console.log('\nThe profiles table does not exist yet: run db/schema.sql in the Supabase SQL editor, then run this script again to fill it.\nUntil then sign-in works from app_metadata.role.');
})().catch((e) => { console.error('seed-users failed:', e.message || e); process.exit(1); });
