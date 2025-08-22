// src/lib/supabase.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || '';
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

if (!url || !key) {
  console.warn('[supabase] Missing SUPABASE_URL and/or key in .env — inserts will fail.');
}

const sb = createClient(url, key, {
  auth: { persistSession: false },
});

module.exports = sb;
