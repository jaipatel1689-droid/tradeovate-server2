// src/routes/dev.js
const express = require('express');
const { sb } = require('../lib/supabase');

const router = express.Router();

/**
 * POST /dev/autofill
 * Body: { follower_id, fill_all=false, slippage=0, status='FILLED' }
 * - fills the most recent PENDING execution for follower_id
 * - if fill_all = true, fills ALL pending for that follower
 * - slippage is a number (e.g., -0.25 or 0.5) added to price to compute avg_fill_price
 */
router.post('/autofill', async (req, res) => {
  try {
    const {
      follower_id,
      fill_all = false,
      slippage = 0,
      status = 'FILLED',
    } = req.body || {};

    if (!follower_id) {
      return res.status(400).json({ error: 'Missing follower_id' });
    }

    // Get pending executions for this follower
    const { data: pendings, error: listErr } = await sb
      .from('executions')
      .select('*')
      .eq('follower_id', follower_id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (listErr) return res.status(500).json({ error: listErr.message });
    if (!pendings || pendings.length === 0) {
      return res.json({ ok: true, message: 'No pending executions found.' });
    }

    const target = fill_all ? pendings : [pendings[0]];

    // Update each pending to filled
    const updates = await Promise.all(
      target.map(async (exec) => {
        const avg = Number(exec.price) + Number(slippage);
        const { data, error } = await sb
          .from('executions')
          .update({
            status,
            filled_qty: exec.qty,
            avg_fill_price: avg,
            updated_at: new Date().toISOString(),
            broker_order_id: exec.broker_order_id || 'SIM-' + exec.id.slice(0, 8),
          })
          .eq('id', exec.id)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        return data;
      })
    );

    res.json({ ok: true, filled: updates.length, rows: updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
