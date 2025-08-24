// src/lib/supabase.js
const { createClient } = require('@supabase/supabase-js');

const url = (process.env.SUPABASE_URL || '').trim();
const key = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim();

if (!url) throw new Error('SUPABASE_URL is required.');
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY (or ANON) is required.');

const sb = createClient(url, key, { auth: { persistSession: false } });
module.exports = sb;