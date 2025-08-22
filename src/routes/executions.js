// src/routes/executions.js
const express = require('express');
const { sb } = require('../lib/supabase');

const router = express.Router();

/**
 * POST /executions
 * Create a new execution request
 * Body: { follower_id, symbol, side, qty, price, trade_ref, signal_id? }
 */
router.post('/', async (req, res) => {
  try {
    const {
      follower_id,
      symbol,
      side,
      qty,
      price,
      trade_ref,
      signal_id = null,
    } = req.body || {};

    // basic validation
    if (!follower_id || !symbol || !side || !qty || !price || !trade_ref) {
      return res.status(400).json({
        error:
          'Missing required fields. Need follower_id, symbol, side, qty, price, trade_ref.',
      });
    }

    const { data, error } = await sb
      .from('executions')
      .insert([
        {
          follower_id,
          symbol,
          side,
          qty,
          price,
          trade_ref,
          signal_id, // nullable by schema (you made it optional)
        },
      ])
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /executions/:followerId
 * List recent executions for a follower
 * Optional query: ?limit=20
 */
router.get('/:followerId', async (req, res) => {
  try {
    const { followerId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 200);

    const { data, error } = await sb
      .from('executions')
      .select('*')
      .eq('follower_id', followerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /executions/:id/fill
 * Mark an execution as filled (or partially filled)
 * Body: { filled_qty, avg_fill_price, status? }  // status default 'FILLED'
 */
router.patch('/:id/fill', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      filled_qty,
      avg_fill_price,
      status = 'FILLED', // e.g., 'FILLED' | 'PARTIAL' | 'CANCELED'
      error = null,
      broker_order_id = null,
    } = req.body || {};

    if (filled_qty == null || avg_fill_price == null) {
      return res
        .status(400)
        .json({ error: 'Need filled_qty and avg_fill_price' });
    }

    const { data, error: upErr } = await sb
      .from('executions')
      .update({
        filled_qty,
        avg_fill_price,
        status,
        error,
        broker_order_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (upErr) return res.status(500).json({ error: upErr.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

