// src/routes/signals.js
const express = require('express');
const sb = require('../lib/supabase');

const router = express.Router();

const up = (v) => (typeof v === 'string' ? v.toUpperCase() : v);

// POST /signals  → insert one signal
router.post('/', async (req, res) => {
  try {
    let {
      user_id,
      symbol,
      side,
      qty,
      price,
      strategy = null,
      confidence = null,
      notes = null,
    } = req.body || {};

    if (!user_id || !symbol || !side || qty == null || price == null) {
      return res.status(400).json({
        error:
          'Missing required fields: user_id, symbol, side, qty, price are required.',
      });
    }

    side = up(side); // your DB CHECK expects 'BUY' or 'SELL'

    const payload = {
      user_id,
      symbol,
      side,
      qty,
      price,
      strategy,
      confidence,
      notes,
      opened_at: new Date().toISOString(),
    };

    const { data, error } = await sb
      .from('signals')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Server insert error',
        detail: error.message,
      });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// GET /signals  → list latest 50
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb
      .from('signals')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(50);

    if (error) {
      return res
        .status(500)
        .json({ error: 'List error', detail: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;

