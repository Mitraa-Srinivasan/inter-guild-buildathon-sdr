require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be set (see .env.example)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Supabase returns { data, error } instead of throwing; unwrap so callers can use try/catch.
function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

module.exports = { supabase, unwrap };
