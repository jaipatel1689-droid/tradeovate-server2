// src/routes/settings.js
const express = require('express');
const { sb } = require('../lib/supabase');

const router = express.Router();

/**
 * GET /settings/:userId
 * Looks up by follower_id = userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await sb
      .from('settings')
      .select('follower_id, mode, multiplier, fixed_qty')
      .eq('follower_id', userId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /settings/:userId
 * Body: { mode?, multiplier?, fixed_qty? }
 * Upserts row, keyed by follower_id
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { mode, multiplier, fixed_qty } = req.body || {};

    const payload = {
      follower_id: userId,
      mode: mode ?? null,
      multiplier: multiplier ?? null,
      fixed_qty: fixed_qty ?? null
    };

    const { data, error } = await sb
      .from('settings')
      .upsert(payload, { onConflict: 'follower_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
