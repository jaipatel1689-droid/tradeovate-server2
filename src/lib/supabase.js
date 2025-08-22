// src/lib/supabase.js
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "Loaded ✅" : "NOT FOUND ❌");

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_KEY ||      // <--- THIS LINE MAKES IT USE YOUR .env SUPABASE_KEY
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[supabase] Missing SUPABASE_URL and/or key in .env — inserts will fail.');
}

const sb = createClient(url, key, {
  auth: { persistSession: false },
});

module.exports = sb;
