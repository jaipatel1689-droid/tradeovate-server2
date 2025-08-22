// src/routes/signals.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

// simple body validator
function pickSignal(payload) {
  const {
    user_id,
    symbol,
    side,
    qty,
    price,
    strategy = null,
    confidence = null,
    notes = null,
  } = payload || {};

  return {
    user_id,
    symbol,
    side: (side || '').toUpperCase(),   // DB CHECK expects BUY/SELL
    qty,
    price,
    strategy,
    confidence,
    notes,
    opened_at: new Date().toISOString(),
  };
}

// POST /signals  -> create
router.post('/', async (req, res) => {
  try {
    const row = pickSignal(req.body);

    // basic required checks before DB round-trip
    const required = ['user_id', 'symbol', 'side', 'qty', 'price'];
    for (const k of required) {
      if (row[k] === undefined || row[k] === null || row[k] === '') {
        return res.status(400).json({ error: `Missing field: ${k}` });
      }
    }
    if (!['BUY', 'SELL'].includes(row.side)) {
      return res.status(400).json({ error: "side must be 'BUY' or 'SELL'" });
    }

    const { data, error } = await sb
      .from('signals')
      .insert(row)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'insert failed', detail: error.message || error });
    }
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server error', detail: String(err) });
  }
});

// GET /signals  -> list
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb
      .from('signals')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: 'query failed', detail: error.message || error });
    }
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'server error', detail: String(err) });
  }
});

module.exports = router;


