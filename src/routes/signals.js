// src/routes/signals.js
const express = require('express');
const router = express.Router();
const sb = require('../lib/supabase');

// POST /signals  (create a signal)
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      follower_id = null,
      symbol,
      side,
      qty,
      price,
      strategy = null,
      confidence = null,
      notes = null,
    } = req.body || {};

    // basic validations (server-side guard rails)
    if (!user_id || !symbol || !side || !qty || !price) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    // enforce check constraint expectation
    const SIDE = String(side).toUpperCase();
    if (!['BUY', 'SELL'].includes(SIDE)) {
      return res.status(400).json({ error: "side must be 'BUY' or 'SELL' (uppercase)" });
    }

    const payload = {
      user_id,
      follower_id,
      symbol,
      side: SIDE,
      qty,
      price,
      strategy,
      confidence,
      notes,
    };

    const { data, error } = await sb.from('signals').insert(payload).select().single();
    if (error) {
      return res.status(500).json({ error: 'Server insert error', detail: error.message });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err?.message || err) });
  }
});

// GET /signals (list most recent)
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb
      .from('signals')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: 'Query error', detail: error.message });
    }
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err?.message || err) });
  }
});

module.exports = router;
