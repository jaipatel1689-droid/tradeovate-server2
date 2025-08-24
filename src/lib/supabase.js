// src/lib/supabase.js
const { createClient } = require('@supabase/supabase-js');

// Prefer the Service Role key so we can write server-side.
// If you intentionally want ANON, set SUPABASE_SERVICE_ROLE_KEY empty
// and provide SUPABASE_ANON_KEY instead.
const url =
  (process.env.SUPABASE_URL || '').trim();

const key =
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() ||
  (process.env.SUPABASE_ANON_KEY || '').trim();

if (!url) throw new Error('SUPABASE_URL is required.');
if (!key) throw new Error('SUPABASE key is required (SERVICE_ROLE or ANON).');

const sb = createClient(url, key, {
  auth: { persistSession: false }
});

module.exports = sb;