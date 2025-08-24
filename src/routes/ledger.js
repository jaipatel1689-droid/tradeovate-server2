// src/routes/ledger.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

const isUUID = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// LIST ledger by user
router.get('/', async (req, res) => {
  const user_id = String(req.query.user_id || '').trim();
  if (!isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });
  try {
    const { data, error } = await sb
      .from('ledger')
      .select('*')
      .eq('user_id', user_id)
      .order('ts', { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error: 'list_failed', detail: error.message });
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// SUMMARY: realized P/L
router.get('/summary', async (req, res) => {
  const user_id = String(req.query.user_id || '').trim();
  if (!isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });
  try {
    const { data, error } = await sb
      .from('ledger')
      .select('amount')
      .eq('user_id', user_id)
      .eq('type', 'REALIZED_PNL');
    if (error) return res.status(500).json({ error: 'select_failed', detail: error.message });

    const total = (data || []).reduce((acc, r) => acc + Number(r.amount || 0), 0);
    res.json({ user_id, realized_pnl: total });
  } catch (err) { res.status(500).json({ error: 'server_error', detail: err.message }); }
});

module.exports = router;
