// src/routes/orders.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

const isUUID = v =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(v || '').trim());

// List recent orders for a user (optional ?user_id=...)
router.get('/', async (req, res) => {
  const user_id = (req.query.user_id || '').trim();
  try {
    let q = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (user_id && isUUID(user_id)) q = q.eq('user_id', user_id);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'server_error', detail: error.message });

    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// Create a basic order (kept minimal to be schema-friendly)
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      signal_id,   // optional; if provided we’ll store it
      symbol,
      side,        // BUY | SELL
      qty,
      price,
      notes = null,
    } = req.body || {};

    if (!isUUID(user_id) || !symbol || !side || !qty || !price) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const payload = {
      user_id,
      signal_id: isUUID(signal_id) ? signal_id : null,
      symbol,
      side: String(side).toUpperCase(),
      qty,
      price,
      status: 'NEW',
      created_at: new Date().toISOString(),
      notes,
    };

    const { data, error } = await sb.from('orders').insert(payload).select().maybeSingle();
    if (error) return res.status(500).json({ error: 'insert_error', detail: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;