// src/routes/signals.js
const express = require('express');
const router = express.Router();

// Supabase client (from src/lib/supabase.js)
const sb = require('../lib/supabase');

/**
 * POST /signals  — create a signal
 * Body (JSON):
 * {
 *   user_id: uuid (required),
 *   symbol: string (required),
 *   side: "BUY" | "SELL" (required; case-insensitive, will be uppercased),
 *   qty: number (required),
 *   price: number (required),
 *   strategy?: string,
 *   confidence?: number,
 *   notes?: string,
 *   follower_id?: uuid   // OPTIONAL — only sent/inserted if provided
 * }
 */
router.post('/', async (req, res) => {
  try {
    // Destructure, but DO NOT default follower_id (keeps it truly optional)
    const {
      user_id,
      follower_id,         // optional
      symbol,
      side,
      qty,
      price,
      strategy = null,
      confidence = null,
      notes = null,
    } = req.body || {};

    // ---------- basic validations ----------
    if (!user_id || !symbol || !side || qty == null || price == null) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }

    // enforce side constraint: uppercase + must be BUY/SELL
    const SIDE = String(side).trim().toUpperCase();
    if (!['BUY', 'SELL'].includes(SIDE)) {
      return res.status(400).json({ error: 'side_must_be_BUY_or_SELL_uppercase' });
    }

    // coerce numerics (server-side guard rails)
    const QTY = Number(qty);
    const PRICE = Number(price);
    if (!Number.isFinite(QTY) || !Number.isFinite(PRICE)) {
      return res.status(400).json({ error: 'qty_and_price_must_be_numbers' });
    }

    // ---------- build payload WITHOUT follower_id by default ----------
    const payload = {
      user_id,
      symbol,
      side: SIDE,
      qty: QTY,
      price: PRICE,
      strategy,
      confidence,
      notes,
    };

    // only add follower_id if the client actually sent it (and it's non-empty)
    if (
      typeof follower_id !== 'undefined' &&
      follower_id !== null &&
      String(follower_id).trim() !== ''
    ) {
      payload.follower_id = follower_id;
    }

    // insert and return the created row
    const { data, error } = await sb.from('signals').insert(payload).select().single();
    if (error) {
      return res.status(500).json({ error: 'server_insert_error', detail: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error('[signals.create] unexpected error:', err);
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/**
 * GET /signals — list recent signals (latest first)
 */
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb
      .from('signals')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: 'server_select_error', detail: error.message });
    }
    return res.json(data || []);
  } catch (err) {
    console.error('[signals.list] unexpected error:', err);
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;
