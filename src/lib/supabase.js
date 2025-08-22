// src/lib/supabase.js
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Prefer the service role key if present; otherwise anon key.
// Your .env.example should list `SUPABASE_URL` and `SUPABASE_KEY`.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url)  console.warn('[supabase] Missing SUPABASE_URL in .env — inserts will fail.');
if (!key)  console.warn('[supabase] Missing SUPABASE_KEY in .env — inserts will fail.');

const sb = createClient(url, key, { auth: { persistSession: false } });

module.exports = sb;
