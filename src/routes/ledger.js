// src/routes/ledger.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

const isUUID = v =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(v || '').trim());

// List recent ledger entries for a user
router.get('/', async (req, res) => {
  const user_id = (req.query.user_id || '').trim();

  if (!isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });

  try {
    const { data, error } = await sb
      .from('ledger')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: 'server_error', detail: error.message });

    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// Add a ledger entry (e.g., REALIZED_PNL)
router.post('/', async (req, res) => {
  try {
    const { user_id, type, amount, notes = null } = req.body || {};
    if (!isUUID(user_id) || !type || typeof amount === 'undefined') {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const payload = {
      user_id,
      type,           // e.g., REALIZED_PNL
      amount: Number(amount),
      notes,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await sb.from('ledger').insert(payload).select().maybeSingle();
    if (error) return res.status(500).json({ error: 'insert_error', detail: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;