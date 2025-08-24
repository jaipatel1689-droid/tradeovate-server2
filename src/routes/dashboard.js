// src/routes/dashboard.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

const isUUID = v =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(v || '').trim());

router.get('/summary', async (req, res) => {
  const user_id = String(req.query.user_id || '').trim();
  if (!isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });

  try {
    const openQ   = sb.from('signals').select('id', { head: true, count: 'exact' }).eq('user_id', user_id).eq('status', 'OPEN');
    const closedQ = sb.from('signals').select('id', { head: true, count: 'exact' }).eq('user_id', user_id).eq('status', 'CLOSED');

    const [openRes, closedRes] = await Promise.all([openQ, closedQ]);
    if (openRes.error)   return res.status(500).json({ error: 'server_error', detail: openRes.error.message });
    if (closedRes.error) return res.status(500).json({ error: 'server_error', detail: closedRes.error.message });

    const open_count   = openRes.count   ?? 0;
    const closed_count = closedRes.count ?? 0;

    const { data: ledgerRows, error: ledgerErr } = await sb
      .from('ledger')
      .select('amount')
      .eq('user_id', user_id)
      .eq('type', 'REALIZED_PNL');

    if (ledgerErr) return res.status(500).json({ error: 'server_error', detail: ledgerErr.message });

    const realized_pnl = (ledgerRows || []).reduce((acc, r) => acc + Number(r.amount || 0), 0);

    return res.json({ user_id, open_count, closed_count, realized_pnl });
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;
